import type { RetirementRecord } from '@cambium-protocol/sdk';

export interface LedgerFilters {
  /** Case-insensitive substring match against record/project/retiree IDs. */
  search?: string;
  vintageYear?: number;
  retireeType?: 'all' | 'public' | 'shielded';
  minAmount?: number;
}

export function filterRetirementRecords(
  records: RetirementRecord[],
  filters: LedgerFilters,
): RetirementRecord[] {
  const query = filters.search?.trim().toLowerCase() ?? '';
  return records.filter((record) => {
    if (filters.vintageYear && record.vintageYear !== filters.vintageYear) {
      return false;
    }
    if (filters.retireeType === 'public' && record.retiree.type !== 'public') {
      return false;
    }
    if (
      filters.retireeType === 'shielded' &&
      record.retiree.type !== 'shielded'
    ) {
      return false;
    }
    if (filters.minAmount && Number(record.amount) < filters.minAmount) {
      return false;
    }
    if (query) {
      const retiree =
        record.retiree.type === 'public' ? record.retiree.address : '';
      const haystack = `${record.id} ${record.projectId} ${retiree}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function availableVintageYears(
  records: RetirementRecord[],
): number[] {
  return Array.from(
    new Set(records.map((record) => record.vintageYear)),
  ).sort((a, b) => b - a);
}
