import { describe, it, expect } from 'vitest';
import { retirementRecordsToCsv } from '@/lib/ledger/csv';
import type { RetirementRecord } from '@cambium-protocol/sdk';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';

const RECORDS: RetirementRecord[] = [
  {
    id: 'ret-1',
    projectId: ACCOUNT,
    vintageYear: 2025,
    amount: '1.5',
    retiredAt: 1712345678,
    retiree: { type: 'public', address: ACCOUNT },
  },
  {
    id: 'ret-2',
    projectId: ACCOUNT,
    vintageYear: 2024,
    amount: '2',
    retiredAt: 1710000000,
    retiree: { type: 'shielded', nullifierHash: '0xabcd' },
  },
];

describe('retirementRecordsToCsv', () => {
  it('emits a header row followed by one row per record', () => {
    const csv = retirementRecordsToCsv(RECORDS);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      'retirement_id,project_id,vintage_year,amount_tco2e,retiree,retired_at',
    );
  });

  it('writes the record fields in order', () => {
    const lines = retirementRecordsToCsv([RECORDS[0]]).split('\n');
    expect(lines[1]).toBe(
      `ret-1,${ACCOUNT},2025,1.5,${ACCOUNT},2024-04-05T19:34:38.000Z`,
    );
  });

  it('writes shielded retiree refs as shielded:nullifier', () => {
    const lines = retirementRecordsToCsv([RECORDS[1]]).split('\n');
    expect(lines[1]).toBe('ret-2,' + ACCOUNT + ',2024,2,shielded:0xabcd,2024-03-09T16:00:00.000Z');
  });

  it('returns just the header for an empty list', () => {
    expect(retirementRecordsToCsv([])).toBe(
      'retirement_id,project_id,vintage_year,amount_tco2e,retiree,retired_at',
    );
  });

  it('quotes cells containing commas or quotes', () => {
    const csv = retirementRecordsToCsv([
      {
        id: 'ret,1',
        projectId: ACCOUNT,
        vintageYear: 2025,
        amount: '1.5',
        retiredAt: 1712345678,
        retiree: { type: 'shielded', nullifierHash: 'ab"cd' },
      },
    ]);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('"ret,1"');
    expect(lines[1]).toContain('shielded:ab""cd');
  });
});
