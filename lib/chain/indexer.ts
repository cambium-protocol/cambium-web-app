import { nativeToScVal, SorobanRpc } from '@stellar/stellar-sdk';
import { RawContractEvent } from './events';

/**
 * On-chain event indexer.
 *
 * Soroban contracts cannot iterate their storage, so SDK list methods
 * (listProjects / listRetirements) cannot enumerate records. This indexer
 * fills that gap by scanning the contract events emitted by successful
 * transactions via `server.getEvents`, using the same RPC endpoint the app
 * already talks to. No external indexer or database is required.
 *
 * Scanning strategy:
 * - start from `startLedger` (defaults to `latestLedger - backTrackWindow`)
 * - page forward through matching events until the RPC returns fewer than
 *   `pageLimit` events (or `maxForwardPages` is reached)
 * - if a window turns up nothing, walk backward `backTrackWindow` ledgers at
 *   a time (bounded by `maxBackTracks`) until records are found or history
 *   is exhausted — this tolerates events being older than the default window
 * - if the RPC rejects a `startLedger` as too old (outside its retention
 *   window), retry from a more recent ledger
 */

export interface ChainIndexerOptions {
  server: SorobanRpc.Server;
  contractId: string;
  /** Only return events whose first topic entry matches this symbol. */
  topicSymbol?: string;
  startLedger?: number;
  backTrackWindow?: number;
  maxBackTracks?: number;
  pageLimit?: number;
  maxForwardPages?: number;
}

export interface IndexedEvents {
  events: RawContractEvent[];
  latestLedger: number;
  scannedFrom: number;
  eventsScanned: number;
}

const DEFAULTS = {
  backTrackWindow: 200_000,
  maxBackTracks: 5,
  pageLimit: 100,
  maxForwardPages: 20,
};

export class ChainEventIndexer {
  private readonly options: ChainIndexerOptions;

  constructor(options: ChainIndexerOptions) {
    this.options = { ...DEFAULTS, ...options };
  }

  private get filters(): SorobanRpc.Api.EventFilter[] {
    const { contractId, topicSymbol } = this.options;
    const filter: SorobanRpc.Api.EventFilter = {
      type: 'contract',
      contractIds: [contractId],
    };
    if (topicSymbol) {
      const topic = nativeToScVal(topicSymbol, { type: 'symbol' });
      filter.topics = [[topic.toXDR('base64')]];
    }
    return [filter];
  }

  private toRawEvent(evt: SorobanRpc.Api.EventResponse): RawContractEvent {
    return {
      eventId: evt.id ?? evt.pagingToken,
      txHash: evt.txHash,
      ledger: evt.ledger,
      ledgerClosedAt: evt.ledgerClosedAt,
      pagingToken: evt.pagingToken,
      contractId: evt.contractId?.toString() ?? this.options.contractId,
      inSuccessfulContractCall: evt.inSuccessfulContractCall,
      topic: evt.topic,
      value: evt.value,
    };
  }

  private async fetchPage(startLedger: number, cursor?: string) {
    const { server, pageLimit } = this.options;
    const request: SorobanRpc.Server.GetEventsRequest = {
      filters: this.filters,
      startLedger,
      limit: pageLimit,
    };
    if (cursor) request.cursor = cursor;
    return server.getEvents(request);
  }

  /** Scan for contract events matching the configured topic symbol. */
  async fetchRawEvents(): Promise<IndexedEvents> {
    const {
      server,
      backTrackWindow,
      maxBackTracks,
      pageLimit,
      maxForwardPages,
    } = this.options;

    const latestResponse = await server.getLatestLedger();
    const latestLedger = latestResponse.sequence;
    const requestedStart =
      this.options.startLedger ?? Math.max(latestLedger - backTrackWindow!, 1);

    const collected: RawContractEvent[] = [];
    const seen = new Set<string>();
    let scannedFrom = requestedStart;
    let eventsScanned = 0;

    let backtracks = maxBackTracks!;
    let start = requestedStart;

    // We try progressively more recent windows if history is rejected or
    // empty, so the indexer degrades gracefully on retention-limited RPCs.
    while (backtracks >= 0) {
      let cursor: string | undefined;
      let forwardPages = 0;
      let foundAny = false;

      try {
        for (;;) {
          const res = await this.fetchPage(start, cursor);
          eventsScanned += res.events.length;

          for (const raw of res.events) {
            if (!raw.inSuccessfulContractCall) continue;
            const event = this.toRawEvent(raw);
            if (!seen.has(event.pagingToken)) {
              seen.add(event.pagingToken);
              collected.push(event);
            }
          }

          if (res.events.length > 0) foundAny = true;
          const last = res.events[res.events.length - 1];
          forwardPages += 1;

          if (
            !last ||
            res.events.length < pageLimit! ||
            forwardPages >= maxForwardPages!
          ) {
            break;
          }
          cursor = last.pagingToken;
        }
      } catch (err) {
        // A rejected startLedger (outside RPC retention) is expected when the
        // configured window predates the RPC's history. Bounce toward recent.
        if (backtracks === 0) throw err;
        start = Math.max(latestLedger - backTrackWindow! * (maxBackTracks! - backtracks + 1), 1);
        backtracks -= 1;
        continue;
      }

      if (foundAny) break;

      if (backtracks === 0) break;
      start = Math.max(start - backTrackWindow!, 1);
      scannedFrom = start;
      backtracks -= 1;
    }

    return {
      events: collected,
      latestLedger,
      scannedFrom,
      eventsScanned,
    };
  }
}
