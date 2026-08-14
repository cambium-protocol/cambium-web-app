import { getCambiumClient } from '@/lib/cambiumClient';
import type { Project, RetirementRecord } from '@cambium-protocol/sdk';
import { cached, clearDataCache } from './cache';
import { ChainEventIndexer } from './indexer';
import {
  decodeProjectEvent,
  decodeRetirementEvent,
  decodeTransferEvent,
  REGISTER_PROJECT_EVENT_NAME,
  RETIRE_EVENT_NAME,
  TRANSFER_EVENT_NAME,
  type ProjectEvent,
  type RetirementEvent,
  type TransferEvent,
} from './events';

/**
 * App-level services that source real on-chain data for the portfolio,
 * ledger, and project explorer pages.
 *
 * These replace SDK list methods (`listProjects`, `listRetirements`) which
 * cannot iterate Soroban storage, with event-based indexing over the same
 * RPC endpoint. `startLedger` / window size are configurable through
 * environment variables so deployments can trade coverage for latency.
 *
 * Results are memoized in a short-TTL in-process cache (see `./cache.ts`) so
 * concurrent page renders and API requests share a single indexer scan.
 */

const DEFAULT_WINDOW = 200_000;

function windowSize(): number {
  const raw = process.env.NEXT_PUBLIC_CHAIN_INDEX_WINDOW;
  if (raw) {
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_WINDOW;
}

function startLedger(): number | undefined {
  const raw = process.env.NEXT_PUBLIC_CHAIN_INDEX_START_LEDGER;
  if (raw) {
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function indexerOptions(contractId: string, topicSymbol: string) {
  return {
    contractId,
    topicSymbol,
    startLedger: startLedger(),
    backTrackWindow: windowSize(),
  };
}

function toRetirementRecord(evt: RetirementEvent): RetirementRecord {
  return {
    id: evt.recordId,
    projectId: evt.projectId,
    vintageYear: evt.vintageYear,
    amount: evt.amount,
    retiredAt: evt.retiredAt,
    retiree: evt.retiree,
  };
}

function toProject(evt: ProjectEvent): Project {
  return {
    id: evt.id,
    methodology: evt.methodology,
    geography: evt.geography,
    externalRegistryRef: evt.externalRegistryRef,
    verifyingKeyVersion: evt.verifyingKeyVersion,
  };
}

/** Decoded `retire` events from the retirement contract, cached. */
function retirementEvents(): Promise<RetirementEvent[]> {
  return cached('chain:retirement-events', async () => {
    const client = getCambiumClient();
    const indexer = new ChainEventIndexer({
      server: client.server,
      ...indexerOptions(client.contracts.retirement, RETIRE_EVENT_NAME),
    });
    const { events } = await indexer.fetchRawEvents();
    return events
      .map(decodeRetirementEvent)
      .filter((evt): evt is RetirementEvent => evt !== null);
  });
}

/** Decoded `register_project` events from the registry contract, cached. */
function projectEvents(): Promise<ProjectEvent[]> {
  return cached('chain:project-events', async () => {
    const client = getCambiumClient();
    const indexer = new ChainEventIndexer({
      server: client.server,
      ...indexerOptions(client.contracts.registry, REGISTER_PROJECT_EVENT_NAME),
    });
    const { events } = await indexer.fetchRawEvents();
    return events
      .map(decodeProjectEvent)
      .filter((evt): evt is ProjectEvent => evt !== null);
  });
}

/** Latest ledger sequence, cached to avoid an extra RPC call per render. */
function latestLedger(): Promise<number> {
  return cached('chain:latest-ledger', async () => {
    const client = getCambiumClient();
    const res = await client.server.getLatestLedger();
    return res.sequence;
  });
}

/** All retirement records emitted by the retirement contract, newest first. */
export async function getRetirementLedger(): Promise<RetirementRecord[]> {
  const records = (await retirementEvents()).map(toRetirementRecord);
  return records.sort((a, b) => b.retiredAt - a.retiredAt);
}

/** All projects registered on the registry contract, newest first. */
export async function getRegisteredProjects(): Promise<Project[]> {
  const projects = (await projectEvents()).map(toProject);
  return projects.sort((a, b) => a.id.localeCompare(b.id));
}

/** Retirement history for a specific wallet address, newest first. */
export async function getRetirementsByRetiree(
  address: string,
): Promise<RetirementRecord[]> {
  const ledger = await getRetirementLedger();
  return ledger.filter(
    (record) =>
      record.retiree.type === 'public' &&
      record.retiree.address.toLowerCase() === address.toLowerCase(),
  );
}

/**
 * Look up the retirement record emitted by a specific transaction hash.
 * Used by the retire flow to surface the on-chain record (and its ID) in the
 * confirmation screen once the transaction lands.
 */
export async function getRetirementByTxHash(
  txHash: string,
): Promise<RetirementRecord | null> {
  const needle = txHash.toLowerCase();
  const match = (await retirementEvents()).find(
    (evt) => evt.txHash.toLowerCase() === needle,
  );
  return match ? toRetirementRecord(match) : null;
}

/**
 * Recent credit-token transfers involving an address, newest first. Used by
 * the portfolio page to show held/traded activity derived from on-chain
 * SEP-41 transfer events.
 */
export async function getCreditTransfers(
  address: string,
): Promise<TransferEvent[]> {
  const needle = address.toLowerCase();
  return cached(`chain:transfers:${needle}`, async () => {
    const client = getCambiumClient();
    const indexer = new ChainEventIndexer({
      server: client.server,
      ...indexerOptions(client.contracts.creditToken, TRANSFER_EVENT_NAME),
    });
    const { events } = await indexer.fetchRawEvents();
    return events
      .map(decodeTransferEvent)
      .filter((evt): evt is TransferEvent => evt !== null)
      .filter(
        (evt) =>
          evt.from.toLowerCase() === needle || evt.to.toLowerCase() === needle,
      )
      .sort((a, b) => b.ledger - a.ledger);
  });
}

export interface ProtocolStats {
  totalRetirements: number;
  totalRetired: string;
  projectsRegistered: number;
  projectsRetiredAgainst: number;
  shieldedRetirements: number;
  latestLedger: number;
}

/**
 * Aggregate protocol statistics for the landing page and the `/api/stats`
 * endpoint. All figures are derived from on-chain events via the cached
 * services above.
 */
export async function getProtocolStats(): Promise<ProtocolStats> {
  const [ledger, projects, latestLedgerSequence] = await Promise.all([
    getRetirementLedger(),
    getRegisteredProjects(),
    latestLedger(),
  ]);

  const totalRetired = ledger
    .reduce((sum, record) => sum + Number(record.amount), 0)
    .toString();

  return {
    totalRetirements: ledger.length,
    totalRetired,
    projectsRegistered: projects.length,
    projectsRetiredAgainst: new Set(ledger.map((r) => r.projectId)).size,
    shieldedRetirements: ledger.filter(
      (r) => r.retiree.type === 'shielded',
    ).length,
    latestLedger: latestLedgerSequence,
  };
}

export { clearDataCache };
