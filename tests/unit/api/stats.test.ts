import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/stats/route';

vi.mock('@/lib/chain', () => ({
  getProtocolStats: vi.fn(),
}));

import { getProtocolStats } from '@/lib/chain';

const STATS = {
  totalRetirements: 42,
  totalRetired: '153.5',
  projectsRegistered: 7,
  projectsRetiredAgainst: 4,
  shieldedRetirements: 3,
  latestLedger: 1_234_567,
};

describe('protocol stats API', () => {
  beforeEach(() => {
    vi.mocked(getProtocolStats).mockReset();
  });

  it('returns aggregate stats derived from on-chain events', async () => {
    vi.mocked(getProtocolStats).mockResolvedValue(STATS);

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(STATS);
    expect(body.totalRetirements).toBe(42);
    expect(body.totalRetired).toBe('153.5');
  });

  it('returns 502 when the on-chain data cannot be loaded', async () => {
    vi.mocked(getProtocolStats).mockRejectedValue(new Error('rpc down'));

    const response = await GET();
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe('Failed to load protocol stats');
  });
});
