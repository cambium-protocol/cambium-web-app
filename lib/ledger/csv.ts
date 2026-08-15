import type { RetirementRecord } from '@cambium-protocol/sdk';

function escapeCell(cell: string): string {
  if (/[",\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

/**
 * Serialize retirement records to RFC-4180 CSV.
 *
 * Columns mirror the on-chain record fields so exported rows can be
 * cross-referenced against the single-record verification endpoint and the
 * certificate PDFs.
 */
export function retirementRecordsToCsv(records: RetirementRecord[]): string {
  const header = [
    'retirement_id',
    'project_id',
    'vintage_year',
    'amount_tco2e',
    'retiree',
    'retired_at',
  ];
  const rows = records.map((record) => [
    record.id,
    record.projectId,
    String(record.vintageYear),
    record.amount,
    record.retiree.type === 'public'
      ? record.retiree.address
      : `shielded:${record.retiree.nullifierHash}`,
    record.retiredAt ? new Date(record.retiredAt * 1000).toISOString() : '',
  ]);
  return [header, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n');
}
