import { getCambiumClient } from '@/lib/cambiumClient';
import type { Project, RetirementRecord } from '@cambium-protocol/sdk';
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

/** All retirement records emitted by the retirement contract, newest first. */
export async function getRetirementLedger(): Promise<RetirementRecord[]> {
  const client = getCambiumClient();
  const indexer = new ChainEventIndexer({
    server: client.server,
    ...indexerOptions(client.contracts.retirement, RETIRE_EVENT_NAME),
  });
  const { events } = await indexer.fetchRawEvents();
  const records = events
    .map(decodeRetirementEvent)
    .filter((evt): evt is RetirementEvent => evt !== null)
    .map(toRetirementRecord);
  return records.sort((a, b) => b.retiredAt - a.retiredAt);
}

/** All projects registered on the registry contract, newest first. */
export async function getRegisteredProjects(): Promise<Project[]> {
  const client = getCambiumClient();
  const indexer = new ChainEventIndexer({
    server: client.server,
    ...indexerOptions(client.contracts.registry, REGISTER_PROJECT_EVENT_NAME),
  });
  const { events } = await indexer.fetchRawEvents();
  const projects = events
    .map(decodeProjectEvent)
    .filter((evt): evt is ProjectEvent => evt !== null)
    .map(toProject);
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
 * Recent credit-token transfers involving an address, newest first. Used by
 * the portfolio page to show held/traded activity derived from on-chain
 * SEP-41 transfer events.
 */
export async function getCreditTransfers(
  address: string,
): Promise<TransferEvent[]> {
  const client = getCambiumClient();
  const indexer = new ChainEventIndexer({
    server: client.server,
    ...indexerOptions(client.contracts.creditToken, TRANSFER_EVENT_NAME),
  });
  const { events } = await indexer.fetchRawEvents();
  const needle = address.toLowerCase();
  return events
    .map(decodeTransferEvent)
    .filter((evt): evt is TransferEvent => evt !== null)
    .filter(
      (evt) =>
        evt.from.toLowerCase() === needle || evt.to.toLowerCase() === needle,
    )
    .sort((a, b) => b.ledger - a.ledger);
}
