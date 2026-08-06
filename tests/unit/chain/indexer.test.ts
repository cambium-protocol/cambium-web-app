import { describe, it, expect, vi } from 'vitest';
import { Address, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { ChainEventIndexer } from '@/lib/chain/indexer';
import { decodeRetirementEvent } from '@/lib/chain/events';
import type { SorobanRpc } from '@stellar/stellar-sdk';

const ACCOUNT_A = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';
const ACCOUNT_B = 'GAT3G5MSCEPXNB4DIMZS2LLVZTPCHBUFEQV3TEGZLBWXOMSNV3V6U2OG';
const CONTRACT_ID =
  'CCDCYQTFJU4JLACU7N7DZB6CZX3OUFZW2JWDQF7BQVWBOH2PFBFL5K3W';

const LATEST = { sequence: 500000, id: 'latest', protocolVersion: '23' };

function retireEvent(ledger: number, idx: number): SorobanRpc.Api.EventResponse {
  return {
    type: 'contract',
    id: `evt-${ledger}-${idx}`,
    ledger,
    ledgerClosedAt: `2025-01-${String(idx + 1).padStart(2, '0')}T00:00:00Z`,
    pagingToken: `${ledger}-${idx}`,
    inSuccessfulContractCall: true,
    txHash: `tx-${ledger}-${idx}`,
    contractId: {
      toString: () => CONTRACT_ID,
    } as SorobanRpc.Api.EventResponse['contractId'],
    topic: [
      nativeToScVal('retire', { type: 'symbol' }),
      new Address(ACCOUNT_A).toScVal(),
      nativeToScVal(2025, { type: 'u32' }),
    ],
    value: xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: nativeToScVal('id', { type: 'symbol' }),
        val: nativeToScVal(`rec-${ledger}-${idx}`, { type: 'string' }),
      }),
      new xdr.ScMapEntry({
        key: nativeToScVal('amount', { type: 'symbol' }),
        val: nativeToScVal('15000000', { type: 'i128' }),
      }),
      new xdr.ScMapEntry({
        key: nativeToScVal('retired_at', { type: 'symbol' }),
        val: nativeToScVal(1710000000 + idx, { type: 'u64' }),
      }),
      new xdr.ScMapEntry({
        key: nativeToScVal('retiree', { type: 'symbol' }),
        val: new Address(ACCOUNT_B).toScVal(),
      }),
    ]),
  };
}

type GetEvents = (req: SorobanRpc.Server.GetEventsRequest) => Promise<SorobanRpc.Api.GetEventsResponse>;

function makeServer(impl: Partial<{ getLatestLedger: () => Promise<typeof LATEST>; getEvents: GetEvents }>) {
  const getLatestLedger = vi.fn(
    impl.getLatestLedger ?? (async () => LATEST),
  );
  const getEvents = vi.fn(
    impl.getEvents ?? (async () => ({ events: [], latestLedger: LATEST.sequence })),
  );
  return {
    server: { getLatestLedger, getEvents } as unknown as SorobanRpc.Server,
    getEvents,
  };
}

describe('ChainEventIndexer', () => {
  it('collects matching contract events within a window', async () => {
    const events = [retireEvent(100, 1), retireEvent(200, 2)];
    const { server, getEvents } = makeServer({
      getEvents: async () => ({ events, latestLedger: LATEST.sequence }),
    });

    const indexer = new ChainEventIndexer({
      server,
      contractId: CONTRACT_ID,
      topicSymbol: 'retire',
      startLedger: 50,
    });
    const result = await indexer.fetchRawEvents();

    expect(result.events).toHaveLength(2);
    expect(getEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [
          expect.objectContaining({
            type: 'contract',
            contractIds: [CONTRACT_ID],
          }),
        ],
      }),
    );
    const decoded = result.events.map(decodeRetirementEvent);
    expect(decoded[0]?.recordId).toBe('rec-100-1');
    expect(decoded[1]?.amount).toBe('1.5');
  });

  it('walks backward in windows when no events are found', async () => {
    const { server } = makeServer({
      getEvents: vi
        .fn<GetEvents>()
        .mockResolvedValueOnce({ events: [], latestLedger: LATEST.sequence })
        .mockResolvedValueOnce({
          events: [retireEvent(10, 1)],
          latestLedger: LATEST.sequence,
        }),
    });

    const indexer = new ChainEventIndexer({
      server,
      contractId: CONTRACT_ID,
      topicSymbol: 'retire',
      startLedger: 400000,
      backTrackWindow: 100000,
      maxBackTracks: 3,
    });
    const result = await indexer.fetchRawEvents();

    expect(result.events).toHaveLength(1);
    expect(result.scannedFrom).toBe(300000);
  });

  it('recovers when the RPC rejects a startLedger outside retention', async () => {
    const { server } = makeServer({
      getEvents: vi
        .fn<GetEvents>()
        .mockRejectedValueOnce(new Error('startLedger too old'))
        .mockResolvedValueOnce({
          events: [retireEvent(99, 1)],
          latestLedger: LATEST.sequence,
        }),
    });

    const indexer = new ChainEventIndexer({
      server,
      contractId: CONTRACT_ID,
      topicSymbol: 'retire',
      startLedger: 1,
      backTrackWindow: 100000,
      maxBackTracks: 2,
    });
    const result = await indexer.fetchRawEvents();

    expect(result.events).toHaveLength(1);
    expect(decodeRetirementEvent(result.events[0])?.recordId).toBe('rec-99-1');
  });

  it('pages forward through the cursor until events are exhausted', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => retireEvent(100, i));
    const page2 = [retireEvent(200, 0)];
    const { server, getEvents } = makeServer({
      getEvents: vi
        .fn<GetEvents>()
        .mockResolvedValueOnce({ events: page1, latestLedger: LATEST.sequence })
        .mockResolvedValueOnce({ events: page2, latestLedger: LATEST.sequence })
        .mockResolvedValueOnce({ events: [], latestLedger: LATEST.sequence }),
    });

    const indexer = new ChainEventIndexer({
      server,
      contractId: CONTRACT_ID,
      topicSymbol: 'retire',
      startLedger: 100,
      pageLimit: 100,
      maxForwardPages: 5,
    });
    const result = await indexer.fetchRawEvents();

    expect(result.events).toHaveLength(101);
    const cursorCall = getEvents.mock.calls.find((c) => c[0].cursor);
    expect(cursorCall?.[0]?.cursor).toBe('100-99');
  });

  it('drops events that failed on-chain (diagnostics)', async () => {
    const good = retireEvent(100, 1);
    const bad = { ...retireEvent(100, 2), inSuccessfulContractCall: false };
    const { server } = makeServer({
      getEvents: async () => ({ events: [good, bad], latestLedger: LATEST.sequence }),
    });

    const indexer = new ChainEventIndexer({
      server,
      contractId: CONTRACT_ID,
      topicSymbol: 'retire',
      startLedger: 100,
    });
    const result = await indexer.fetchRawEvents();

    expect(result.events).toHaveLength(1);
  });

  it('uses latestLedger - window as the default start when unspecified', async () => {
    const { server, getEvents } = makeServer({
      getEvents: async () => ({ events: [], latestLedger: LATEST.sequence }),
    });

    const indexer = new ChainEventIndexer({
      server,
      contractId: CONTRACT_ID,
      topicSymbol: 'retire',
      backTrackWindow: 1000,
      maxBackTracks: 0,
    });
    await indexer.fetchRawEvents();

    const call = getEvents.mock.calls[0][0];
    expect(call.startLedger).toBe(499000);
  });
});
