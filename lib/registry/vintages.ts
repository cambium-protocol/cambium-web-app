import { FIXED_POINT_SCALE, fixedPointToString } from '@/lib/chain';
import type { Vintage } from '@cambium-protocol/sdk';

/**
 * Vintage supply helpers for the project detail page.
 *
 * The registry contract exposes individual vintages via getVintage(id, year)
 * but not an iteration API, so the page probes a bounded range of years and
 * keeps the ones that exist. Amounts from the SDK are decimal strings; they
 * are converted to a fixed-point bigint (10^7 scale) so supply math is
 * exact and consistent with the chain's amount encoding.
 */

export interface VintageProbeOptions {
  startYear?: number;
  endYear?: number;
  maxResults?: number;
}

export const DEFAULT_VINTAGE_HISTORY = 12;

/** Probe years newest-first until `maxResults` vintages are found. */
export async function fetchVintageSupply(
  getVintage: (year: number) => Promise<Vintage>,
  options: VintageProbeOptions = {},
): Promise<Vintage[]> {
  const endYear = options.endYear ?? new Date().getFullYear();
  const startYear = options.startYear ?? endYear - (DEFAULT_VINTAGE_HISTORY - 1);
  const maxResults = options.maxResults ?? DEFAULT_VINTAGE_HISTORY;

  const vintages: Vintage[] = [];
  for (let year = endYear; year >= startYear; year--) {
    if (vintages.length >= maxResults) break;
    try {
      const vintage = await getVintage(year);
      vintages.push(vintage);
    } catch {
      // no vintage issued for this year — skip
    }
  }
  return vintages.sort((a, b) => b.year - a.year);
}

/** Parse a decimal string into a fixed-point (10^7) bigint. */
export function decimalToFixedPoint(text: string): bigint {
  const cleaned = text.trim();
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return BigInt(0);
  const negative = cleaned.startsWith('-');
  const abs = negative ? cleaned.slice(1) : cleaned;
  const [whole, frac = ''] = abs.split('.');
  const scaled =
    BigInt(whole || '0') * FIXED_POINT_SCALE +
    BigInt(frac.padEnd(7, '0').slice(0, 7) || '0');
  return negative ? -scaled : scaled;
}

/** Available supply for a vintage, floored at zero. */
export function availableSupply(vintage: Vintage): bigint {
  const available =
    decimalToFixedPoint(vintage.totalIssued) -
    decimalToFixedPoint(vintage.totalRetired);
  return available > BigInt(0) ? available : BigInt(0);
}

/** Format an available-supply bigint as a human decimal string. */
export function formatSupply(supply: bigint): string {
  return fixedPointToString(supply);
}
