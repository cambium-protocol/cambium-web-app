import { Address, scValToBigInt, xdr } from '@stellar/stellar-sdk';

/**
 * Low-level helpers for decoding Soroban `ScVal` values into plain JS values.
 *
 * These are used to interpret contract events returned by `server.getEvents`
 * and transaction result meta, where (unlike SDK method results) no Rust
 * spec / type information is available to drive decoding.
 */

/** Stellar fixed-point scale used for signed/unsigned 128-bit amounts (10^7). */
export const FIXED_POINT_SCALE = BigInt(10) ** BigInt(7);

/** Return the ScVal arm name, e.g. `'scvU32'`, `'scvAddress'`, `'scvVoid'`. */
export function scvalArm(scv: xdr.ScVal): string {
  return scv.switch().name;
}

export function isScval(scv: unknown): scv is xdr.ScVal {
  return !!scv && typeof (scv as xdr.ScVal).switch === 'function';
}

/**
 * Decode any integer-typed ScVal (u32/i32/u64/i64/u128/i128/u256/i256,
 * timepoint, duration) into a bigint.
 */
export function scvalToBigIntSafe(scv: xdr.ScVal): bigint {
  switch (scvalArm(scv)) {
    case 'scvTimepoint':
      return scv.timepoint().toBigInt();
    case 'scvDuration':
      return scv.duration().toBigInt();
    default:
      return scValToBigInt(scv);
  }
}

/** Decode an ScVal carrying a Stellar account/contract address. */
export function addressFromScVal(scv: xdr.ScVal): string {
  return Address.fromScVal(scv).toString();
}

/**
 * Format a fixed-point integer (scaled by 10^7) as a trimmed decimal string,
 * e.g. `15000000n` -> `"1.5"`.
 */
export function fixedPointToString(raw: bigint): string {
  const negative = raw < BigInt(0);
  const abs = raw < BigInt(0) ? -raw : raw;
  const whole = abs / FIXED_POINT_SCALE;
  const frac = abs % FIXED_POINT_SCALE;
  let result = whole.toString();
  if (frac !== BigInt(0)) {
    const padded = frac.toString().padStart(7, '0').replace(/0+$/, '');
    result = `${result}.${padded}`;
  }
  return negative ? `-${result}` : result;
}

/**
 * Decode a fixed-point amount (i128/u64, scaled by 10^7) into a trimmed
 * decimal string, e.g. `1.5000000` -> `"1.5"`. Amounts with trailing zeros
 * are trimmed; the scale matches Stellar's native i128/i256 encoding.
 *
 * String/symbol payloads are assumed to already be human-readable amounts and
 * are returned unchanged (some contracts emit amounts as strings).
 */
export function amountFromScVal(scv: xdr.ScVal): string {
  const arm = scvalArm(scv);
  if (arm === 'scvString' || arm === 'scvSymbol') {
    const text = String(scv.str() ?? scv.sym());
    return Number.isNaN(Number(text)) ? '0' : text;
  }
  return fixedPointToString(scvalToBigIntSafe(scv));
}

/** Decode an ScVal into a human-readable string (for display and search). */
export function scvalToText(scv: xdr.ScVal): string {
  switch (scvalArm(scv)) {
    case 'scvVoid':
      return '';
    case 'scvBool':
      return String(scv.b());
    case 'scvSymbol':
      return String(scv.sym());
    case 'scvString':
      return String(scv.str());
    case 'scvAddress':
      return addressFromScVal(scv);
    case 'scvBytes':
      return scv.bytes().toString('hex');
    case 'scvTimepoint':
    case 'scvDuration':
    case 'scvU32':
    case 'scvI32':
    case 'scvU64':
    case 'scvI64':
    case 'scvU128':
    case 'scvI128':
    case 'scvU256':
    case 'scvI256':
      return scvalToBigIntSafe(scv).toString();
    case 'scvVec': {
      const items = scv.vec();
      return items ? items.map(scvalToText).join(', ') : '';
    }
    case 'scvMap': {
      const entries = scv.map();
      return entries
        ? entries
            .map((e) => `${scvalToText(e.key())}: ${scvalToText(e.val())}`)
            .join(', ')
        : '';
    }
    default:
      return '';
  }
}

/**
 * Convert an ScVal map into an array of { key, value } entries so callers
 * can look fields up by name without knowing the exact XDR shape.
 */
export function scvalMapEntries(
  scv: xdr.ScVal,
): { key: string; value: xdr.ScVal }[] {
  if (scvalArm(scv) !== 'scvMap') return [];
  const entries = scv.map();
  if (!entries) return [];
  return entries.map((entry) => ({
    key: scvalToText(entry.key()),
    value: entry.val(),
  }));
}

/** Return the ScVal[] payload of a vec, or `[]` for non-vec values. */
export function scvalVecItems(scv: xdr.ScVal): xdr.ScVal[] {
  if (scvalArm(scv) !== 'scvVec') return [];
  return scv.vec() ?? [];
}
