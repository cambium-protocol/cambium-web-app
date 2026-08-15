import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getLedger } from '@/app/api/ledger/route';
import { GET as getRecord } from '@/app/api/retirements/[id]/route';
import type { RetirementRecord } from '@cambium-protocol/sdk';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';

const RECORDS = [
  {
    id: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    projectId: ACCOUNT,
    vintageYear: 2025,
    amount: '1.5',
    retiredAt: 1712345678,
    retiree: { type: 'public', address: ACCOUNT },
  },
];

vi.mock('@/lib/chain', () => ({
  getRetirementLedger: vi.fn(),
}));

import { getRetirementLedger } from '@/lib/chain';

describe('public ledger API', () => {
  beforeEach(() => {
    vi.mocked(getRetirementLedger).mockReset();
  });

  it('returns records with counts and clamps the limit', async () => {
    vi.mocked(getRetirementLedger).mockResolvedValue(RECORDS as any);

    const response = await getLedger(
      new Request('http://localhost/api/ledger?limit=9999'),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
    expect(body.returned).toBe(1);
    expect(body.records[0].amount).toBe('1.5');
  });

  it('filters by retiree address', async () => {
    vi.mocked(getRetirementLedger).mockResolvedValue(RECORDS as any);

    const response = await getLedger(
      new Request(`http://localhost/api/ledger?retiree=${ACCOUNT}`),
    );
    const body = await response.json();
    expect(body.count).toBe(1);

    const none = await getLedger(
      new Request('http://localhost/api/ledger?retiree=G000000000000000000000000000000000000000000000000000'),
    );
    expect((await none.json()).count).toBe(0);
  });

  it('exports filtered records as CSV when format=csv', async () => {
    vi.mocked(getRetirementLedger).mockResolvedValue(
      RECORDS as unknown as RetirementRecord[],
    );

    const response = await getLedger(
      new Request('http://localhost/api/ledger?format=csv'),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');

    const text = await response.text();
    expect(text.split('\n')).toHaveLength(2);
    expect(text).toContain('retirement_id,project_id,vintage_year');
    expect(text).toContain('abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789');
    expect(text).toContain('1.5');
  });
});

describe('record verification API', () => {
  beforeEach(() => {
    vi.mocked(getRetirementLedger).mockReset();
  });

  it('verifies a record by ID', async () => {
    vi.mocked(getRetirementLedger).mockResolvedValue(RECORDS as any);

    const response = await getRecord(
      new Request('http://localhost/api/retirements/abc'),
      { params: Promise.resolve({ id: RECORDS[0].id.toUpperCase() }) },
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.verified).toBe(true);
    expect(body.record.id).toBe(RECORDS[0].id);
  });

  it('returns 404 for an unknown ID', async () => {
    vi.mocked(getRetirementLedger).mockResolvedValue(RECORDS as any);

    const response = await getRecord(
      new Request('http://localhost/api/retirements/unknown'),
      { params: Promise.resolve({ id: 'unknown' }) },
    );
    expect(response.status).toBe(404);
  });
});
