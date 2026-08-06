import { NextResponse } from 'next/server';
import { getRetirementLedger } from '@/lib/chain';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Single-record verification endpoint.
 *
 * GET /api/retirements/:id
 *
 * Looks a retirement record up by its on-chain ID (exact, case-insensitive)
 * from the event-derived ledger. This is the canonical way for third parties
 * to verify a retirement or certificate against on-chain state.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const ledger = await getRetirementLedger();
  const needle = id.toLowerCase();
  const record = ledger.find((r) => r.id.toLowerCase() === needle);

  if (!record) {
    return NextResponse.json({ error: 'Retirement record not found' }, { status: 404 });
  }

  return NextResponse.json(
    { verified: true, record },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
