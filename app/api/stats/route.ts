import { NextResponse } from 'next/server';
import { getProtocolStats } from '@/lib/chain';

export const dynamic = 'force-dynamic';

/**
 * Protocol statistics endpoint.
 *
 * GET /api/stats
 *
 * Returns aggregate figures derived from on-chain events: total retirements,
 * total tCO2e retired, registered projects, projects retired against, and
 * shielded retirements. Used by the landing page and available to third
 * parties; numbers are recomputed from the event feed (memoized in-process).
 */
export async function GET() {
  try {
    const stats = await getProtocolStats();
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load protocol stats' },
      { status: 502 },
    );
  }
}
