import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/certificates/[id]/route';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';

vi.mock('@/lib/cambiumClient', () => ({
  getCambiumClient: vi.fn(),
}));

import { getCambiumClient } from '@/lib/cambiumClient';

describe('retirement certificate route', () => {
  beforeEach(() => {
    vi.mocked(getCambiumClient).mockReset();
  });

  it('returns 404 when the retirement record cannot be found', async () => {
    vi.mocked(getCambiumClient).mockReturnValue({
      retirement: {
        getRetirement: vi.fn(async () => {
          throw new Error('not found');
        }),
      },
    } as any);

    const response = await GET(new Request('http://localhost/api/certificates/x'), {
      params: Promise.resolve({ id: 'does-not-exist' }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Retirement record not found');
  });

  it('renders a downloadable PDF for an existing record', async () => {
    vi.mocked(getCambiumClient).mockReturnValue({
      retirement: {
        getRetirement: vi.fn(async () => ({
          id: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
          projectId: ACCOUNT,
          vintageYear: 2025,
          amount: '1.5',
          retiredAt: 1712345678,
          retiree: { type: 'public', address: ACCOUNT },
        })),
      },
    } as any);

    const response = await GET(
      new Request('http://localhost/api/certificates/abc'),
      { params: Promise.resolve({ id: 'abc' }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.length).toBeGreaterThan(100);
  });
});
