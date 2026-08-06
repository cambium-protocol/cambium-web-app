/** Shared presentation helpers. */

/** Truncate a long identifier (address, hash) for compact display. */
export function shortAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

/** Render a unix-seconds timestamp as a localized date string. */
export function formatDate(seconds: number): string {
  if (!seconds) return '—';
  return new Date(seconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Parse a decimal amount string into a display-safe number. */
export function parseAmount(amount: string): number {
  const parsed = Number(amount);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Format a decimal amount with up to 4 significant decimals. */
export function formatAmount(amount: string): string {
  const value = parseAmount(amount);
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (abs >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value.toLocaleString(undefined, { maximumSignificantDigits: 4 });
}
