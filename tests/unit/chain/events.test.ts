import { describe, it, expect } from 'vitest';
import { Address, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import {
  amountFromScVal,
  addressFromScVal,
  scvalToText,
  scvalToBigIntSafe,
} from '@/lib/chain/scval';
import {
  decodeRetirementEvent,
  decodeProjectEvent,
  decodeTransferEvent,
  eventNameFromTopic,
  type RawContractEvent,
} from '@/lib/chain/events';

const ACCOUNT_A = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';
const ACCOUNT_B = 'GAT3G5MSCEPXNB4DIMZS2LLVZTPCHBUFEQV3TEGZLBWXOMSNV3V6U2OG';
const CONTRACT_ID =
  'CCDCYQTFJU4JLACU7N7DZB6CZX3OUFZW2JWDQF7BQVWBOH2PFBFL5K3W';

function mapEntry(key: string, value: xdr.ScVal): xdr.ScMapEntry {
  return new xdr.ScMapEntry({
    key: nativeToScVal(key, { type: 'symbol' }),
    val: value,
  });
}

function baseEvent(overrides: Partial<RawContractEvent>): RawContractEvent {
  return {
    eventId: 'evt-1',
    txHash: 'tx-hash-1',
    ledger: 1000,
    ledgerClosedAt: '2025-01-01T00:00:00Z',
    pagingToken: '1000-1',
    contractId: CONTRACT_ID,
    inSuccessfulContractCall: true,
    topic: [],
    value: xdr.ScVal.scvVoid(),
    ...overrides,
  };
}

describe('scval utilities', () => {
  it('decodes fixed-point i128 amounts by dividing by 10^7', () => {
    expect(amountFromScVal(nativeToScVal('15000000', { type: 'i128' }))).toBe(
      '1.5',
    );
    expect(amountFromScVal(nativeToScVal('10000000', { type: 'i128' }))).toBe(
      '1',
    );
    expect(amountFromScVal(nativeToScVal('12345', { type: 'i128' }))).toBe(
      '0.0012345',
    );
  });

  it('passes through string amounts unchanged', () => {
    expect(amountFromScVal(nativeToScVal('2.75', { type: 'string' }))).toBe(
      '2.75',
    );
  });

  it('decodes addresses', () => {
    const scv = new Address(ACCOUNT_A).toScVal();
    expect(addressFromScVal(scv)).toBe(ACCOUNT_A);
  });

  it('decodes symbols, strings, and u64 values to text', () => {
    expect(scvalToText(nativeToScVal('retire', { type: 'symbol' }))).toBe(
      'retire',
    );
    expect(scvalToText(nativeToScVal('hello', { type: 'string' }))).toBe(
      'hello',
    );
    expect(scvalToText(nativeToScVal(42, { type: 'u64' }))).toBe('42');
    expect(
      scvalToBigIntSafe(nativeToScVal(1712345678, { type: 'u64' })).toString(),
    ).toBe('1712345678');
  });
});

describe('event decoding', () => {
  it('extracts the event name from the topic symbol', () => {
    const topic = [nativeToScVal('retire', { type: 'symbol' })];
    expect(eventNameFromTopic(topic)).toBe('retire');
    expect(eventNameFromTopic([])).toBe('');
  });

  it('decodes a retire event with a map payload', () => {
    const topic = [
      nativeToScVal('retire', { type: 'symbol' }),
      new Address(ACCOUNT_A).toScVal(),
      nativeToScVal(2025, { type: 'u32' }),
    ];
    const value = xdr.ScVal.scvMap([
      mapEntry('id', nativeToScVal('rec-1', { type: 'string' })),
      mapEntry('amount', nativeToScVal('15000000', { type: 'i128' })),
      mapEntry('retired_at', nativeToScVal(1712345678, { type: 'u64' })),
      mapEntry('retiree', new Address(ACCOUNT_B).toScVal()),
    ]);
    const evt = baseEvent({ topic, value });

    const decoded = decodeRetirementEvent(evt);
    expect(decoded).not.toBeNull();
    expect(decoded?.kind).toBe('retirement');
    expect(decoded?.recordId).toBe('rec-1');
    expect(decoded?.projectId).toBe(ACCOUNT_A);
    expect(decoded?.vintageYear).toBe(2025);
    expect(decoded?.amount).toBe('1.5');
    expect(decoded?.retiredAt).toBe(1712345678);
    expect(decoded?.retiree).toEqual({ type: 'public', address: ACCOUNT_B });
    expect(decoded?.txHash).toBe('tx-hash-1');
  });

  it('decodes a retire event with a positional vec payload', () => {
    const topic = [
      nativeToScVal('retire', { type: 'symbol' }),
      new Address(ACCOUNT_A).toScVal(),
      nativeToScVal(2024, { type: 'u32' }),
    ];
    const value = xdr.ScVal.scvVec([
      nativeToScVal('rec-2', { type: 'string' }),
      nativeToScVal('25000000', { type: 'i128' }),
      nativeToScVal(1710000000, { type: 'u64' }),
      new Address(ACCOUNT_B).toScVal(),
    ]);
    const decoded = decodeRetirementEvent(baseEvent({ topic, value }));
    expect(decoded?.recordId).toBe('rec-2');
    expect(decoded?.amount).toBe('2.5');
    expect(decoded?.retiredAt).toBe(1710000000);
  });

  it('decodes a shielded retiree as a nullifier hash', () => {
    const topic = [
      nativeToScVal('retire', { type: 'symbol' }),
      new Address(ACCOUNT_A).toScVal(),
      nativeToScVal(2025, { type: 'u32' }),
    ];
    const nullifier = Buffer.from('abcdef0123456789', 'hex');
    const value = xdr.ScVal.scvMap([
      mapEntry('id', nativeToScVal('rec-3', { type: 'string' })),
      mapEntry('amount', nativeToScVal('15000000', { type: 'i128' })),
      mapEntry('retired_at', nativeToScVal(1712345678, { type: 'u64' })),
      mapEntry('retiree', xdr.ScVal.scvBytes(nullifier)),
    ]);
    const decoded = decodeRetirementEvent(baseEvent({ topic, value }));
    expect(decoded?.retiree).toEqual({
      type: 'shielded',
      nullifierHash: 'abcdef0123456789',
    });
  });

  it('returns null for events that do not match the retire schema', () => {
    const topic = [nativeToScVal('something_else', { type: 'symbol' })];
    expect(decodeRetirementEvent(baseEvent({ topic }))).toBeNull();
    expect(decodeRetirementEvent(baseEvent({}))).toBeNull();
  });

  it('decodes a register_project event', () => {
    const topic = [
      nativeToScVal('register_project', { type: 'symbol' }),
      new Address(ACCOUNT_A).toScVal(),
    ];
    const value = xdr.ScVal.scvMap([
      mapEntry('id', new Address(ACCOUNT_A).toScVal()),
      mapEntry('methodology', nativeToScVal('ARR', { type: 'symbol' })),
      mapEntry('geography', nativeToScVal('Kenya', { type: 'string' })),
      mapEntry('verifying_key_version', nativeToScVal(2, { type: 'u32' })),
    ]);
    const decoded = decodeProjectEvent(baseEvent({ topic, value }));
    expect(decoded?.kind).toBe('project');
    expect(decoded?.id).toBe(ACCOUNT_A);
    expect(decoded?.methodology).toBe('ARR');
    expect(decoded?.geography).toBe('Kenya');
    expect(decoded?.verifyingKeyVersion).toBe(2);
  });

  it('decodes a transfer event', () => {
    const topic = [
      nativeToScVal('transfer', { type: 'symbol' }),
      new Address(ACCOUNT_A).toScVal(),
      new Address(ACCOUNT_B).toScVal(),
    ];
    const value = nativeToScVal('30000000', { type: 'i128' });
    const decoded = decodeTransferEvent(baseEvent({ topic, value }));
    expect(decoded?.kind).toBe('transfer');
    expect(decoded?.from).toBe(ACCOUNT_A);
    expect(decoded?.to).toBe(ACCOUNT_B);
    expect(decoded?.amount).toBe('3');
  });

  it('returns null for non-transfer token events', () => {
    const topic = [
      nativeToScVal('mint', { type: 'symbol' }),
      new Address(ACCOUNT_A).toScVal(),
      new Address(ACCOUNT_B).toScVal(),
    ];
    expect(decodeTransferEvent(baseEvent({ topic }))).toBeNull();
  });
});
