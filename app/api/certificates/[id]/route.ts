import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { getCambiumClient } from '@/lib/cambiumClient';
import { shortAddress, formatAmount, formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Retirement certificate — a downloadable PDF that records a retirement as it
 * exists on the chain. The record is looked up by ID via the SDK, so the
 * certificate always reflects current on-chain state, never a cached copy.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  let record;
  try {
    const client = getCambiumClient();
    record = await client.retirement.getRetirement(id);
  } catch {
    return NextResponse.json(
      { error: 'Retirement record not found' },
      { status: 404 },
    );
  }

  const retiree =
    record.retiree.type === 'public'
      ? shortAddress(record.retiree.address)
      : `shielded (${shortAddress(record.retiree.nullifierHash)})`;

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: `Retirement Certificate ${shortAddress(record.id)}`,
      Author: 'Cambium Protocol',
      Subject: 'Carbon credit retirement certificate',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc
    .fontSize(20)
    .fillColor('#111827')
    .text('Cambium Protocol', { align: 'center' })
    .moveDown(0.25)
    .fontSize(14)
    .fillColor('#4b5563')
    .text('Retirement Certificate', { align: 'center' })
    .moveDown(0.5)
    .fontSize(32)
    .fillColor('#111827')
    .text(`${formatAmount(record.amount)} tCO2e`, { align: 'center' })
    .moveDown(0.25)
    .fontSize(11)
    .fillColor('#374151')
    .text(
      'of verified carbon credits permanently retired on the\nCambium Protocol registry',
      { align: 'center' },
    )
    .moveDown(1.25);

  const line = (label: string, value: string) => {
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text(label, { continued: true })
      .fillColor('#111827')
      .text(`  ${value}`);
  };

  line('Retirement ID', shortAddress(record.id, 16, 12));
  line('Project ID', shortAddress(record.projectId, 16, 12));
  line('Vintage Year', String(record.vintageYear));
  line('Retiree', retiree);
  line('Retired At', formatDate(record.retiredAt));
  line('Record Type', 'On-chain');

  doc
    .moveDown(2)
    .fontSize(9)
    .fillColor('#9ca3af')
    .text(
      `Verify this certificate on-chain with retirement ID ${record.id} at the Cambium retirement contract.`,
      { align: 'center' },
    );

  doc.end();
  const buffer = await done;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cambium-certificate-${record.id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
