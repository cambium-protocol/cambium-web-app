import { NextResponse } from 'next/server';
import { getRetirementLedger } from '@/lib/chain';

export const dynamic = 'force-dynamic';

/**
 * Public retirement ledger API.
 *
 * GET /api/ledger?limit=50&projectId=G…&retiree=G…
 *
 * Returns retirement records sourced from on-chain events, newest first.
 * `limit` is clamped to [1, 500] (default 50). `projectId` and `retiree`
 * filter by exact (case-insensitive) address.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 1),
    500,
  );
  const projectId = url.searchParams.get('projectId');
  const retiree = url.searchParams.get('retiree');

  const ledger = await getRetirementLedger();

  let records = ledger;
  if (projectId) {
    const needle = projectId.toLowerCase();
    records = records.filter((r) => r.projectId.toLowerCase() === needle);
  }
  if (retiree) {
    const needle = retiree.toLowerCase();
    records = records.filter(
      (r) => r.retiree.type === 'public' && r.retiree.address.toLowerCase() === needle,
    );
  }

  return NextResponse.json(
    {
      count: records.length,
      returned: Math.min(records.length, limit),
      records: records.slice(0, limit),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
