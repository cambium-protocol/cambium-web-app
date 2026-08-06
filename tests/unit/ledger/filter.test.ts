import { describe, it, expect } from 'vitest';
import {
  filterRetirementRecords,
  availableVintageYears,
  type LedgerFilters,
} from '@/lib/ledger/filter';
import type { RetirementRecord } from '@cambium-protocol/sdk';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';

function record(overrides: Partial<RetirementRecord>): RetirementRecord {
  return {
    id: 'ret-1',
    projectId: ACCOUNT,
    vintageYear: 2025,
    amount: '10',
    retiredAt: 1712345678,
    retiree: { type: 'public', address: ACCOUNT },
    ...overrides,
  };
}

const records = [
  record({ id: 'ret-a', projectId: ACCOUNT, vintageYear: 2025, amount: '10' }),
  record({
    id: 'ret-b',
    projectId: 'GAT3G5MSCEPXNB4DIMZS2LLVZTPCHBUFEQV3TEGZLBWXOMSNV3V6U2OG',
    vintageYear: 2024,
    amount: '2.5',
  }),
  record({
    id: 'ret-c',
    vintageYear: 2025,
    amount: '0.5',
    retiree: { type: 'shielded', nullifierHash: 'abc123' },
  }),
];

function apply(records: RetirementRecord[], filters: LedgerFilters) {
  return filterRetirementRecords(records, filters);
}

describe('filterRetirementRecords', () => {
  it('returns all records when no filters are set', () => {
    expect(apply(records, {})).toHaveLength(3);
  });

  it('filters by vintage year', () => {
    const result = apply(records, { vintageYear: 2024 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ret-b');
  });

  it('filters by retiree type', () => {
    expect(apply(records, { retireeType: 'shielded' }).map((r) => r.id)).toEqual(
      ['ret-c'],
    );
    expect(apply(records, { retireeType: 'public' })).toHaveLength(2);
  });

  it('filters by minimum amount', () => {
    const result = apply(records, { minAmount: 3 });
    expect(result.map((r) => r.id)).toEqual(['ret-a']);
  });

  it('matches a search query against record, project, and retiree IDs', () => {
    expect(apply(records, { search: 'ret-b' })).toHaveLength(1);
    expect(
      apply(records, { search: ACCOUNT.slice(0, 8).toLowerCase() }),
    ).toHaveLength(3);
    expect(apply(records, { search: 'garbage' })).toHaveLength(0);
  });

  it('combines multiple filters', () => {
    const result = apply(records, {
      search: 'ret-',
      vintageYear: 2025,
      retireeType: 'public',
      minAmount: 1,
    });
    expect(result.map((r) => r.id)).toEqual(['ret-a']);
  });
});

describe('availableVintageYears', () => {
  it('returns unique years sorted newest first', () => {
    expect(availableVintageYears(records)).toEqual([2025, 2024]);
  });
});
