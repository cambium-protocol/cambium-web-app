import { NextResponse } from 'next/server';
import { getRetirementLedger } from '@/lib/chain';
import { retirementRecordsToCsv } from '@/lib/ledger/csv';

export const dynamic = 'force-dynamic';

/**
 * Public retirement ledger API.
 *
 * GET /api/ledger?limit=50&projectId=G…&retiree=G…&format=csv
 *
 * Returns retirement records sourced from on-chain events, newest first.
 * `limit` is clamped to [1, 500] (default 50). `projectId` and `retiree`
 * filter by exact (case-insensitive) address. With `format=csv` the response
 * is an RFC-4180 CSV download of the filtered records.
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

  if (url.searchParams.get('format') === 'csv') {
    const csv = retirementRecordsToCsv(records);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cambium-retirements.csv"',
        'Cache-Control': 'no-store',
      },
    });
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
