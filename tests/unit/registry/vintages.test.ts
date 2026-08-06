import { describe, it, expect, vi } from 'vitest';
import {
  fetchVintageSupply,
  decimalToFixedPoint,
  availableSupply,
  formatSupply,
} from '@/lib/registry/vintages';
import type { Vintage } from '@cambium-protocol/sdk';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';

function vintage(year: number, issued: string, retired: string): Vintage {
  return {
    projectId: ACCOUNT,
    year,
    totalIssued: issued,
    totalRetired: retired,
  };
}

describe('fetchVintageSupply', () => {
  it('collects existing vintages and skips years without issuance', async () => {
    const getVintage = vi.fn(async (year: number) => {
      if (year === 2025 || year === 2023) return vintage(year, '100', '20');
      throw new Error('not found');
    });

    const result = await fetchVintageSupply(getVintage, {
      startYear: 2023,
      endYear: 2025,
    });

    expect(result.map((v) => v.year)).toEqual([2025, 2023]);
    expect(getVintage).toHaveBeenCalledWith(2025);
    expect(getVintage).toHaveBeenCalledWith(2024);
  });

  it('stops probing once maxResults vintages are found', async () => {
    const getVintage = vi.fn(async (year: number) => vintage(year, '10', '1'));
    const result = await fetchVintageSupply(getVintage, {
      startYear: 2019,
      endYear: 2025,
      maxResults: 3,
    });
    expect(result).toHaveLength(3);
    expect(result[0].year).toBe(2025);
  });

  it('uses the current year as the probe end by default', async () => {
    const getVintage = vi.fn(async () => {
      throw new Error('not found');
    });
    const year = new Date().getFullYear();
    const result = await fetchVintageSupply(getVintage, { maxResults: 2 });
    expect(result).toEqual([]);
    expect(getVintage).toHaveBeenCalledWith(year);
  });
});

describe('availableSupply', () => {
  it('computes issued minus retired in fixed-point', () => {
    expect(availableSupply(vintage(2025, '1.5', '0.5'))).toBe(BigInt(10000000));
    expect(formatSupply(availableSupply(vintage(2025, '1.5', '0.5')))).toBe('1');
  });

  it('floors available supply at zero', () => {
    expect(availableSupply(vintage(2025, '0.5', '2'))).toBe(BigInt(0));
  });
});

describe('decimalToFixedPoint', () => {
  it('converts decimal strings to the 10^7 scale', () => {
    expect(decimalToFixedPoint('1.5')).toBe(BigInt(15000000));
    expect(decimalToFixedPoint('1')).toBe(BigInt(10000000));
    expect(decimalToFixedPoint('0.001')).toBe(BigInt(10000));
    expect(decimalToFixedPoint('-2')).toBe(BigInt(-20000000));
  });

  it('rejects malformed input with zero', () => {
    expect(decimalToFixedPoint('abc')).toBe(BigInt(0));
    expect(decimalToFixedPoint('')).toBe(BigInt(0));
  });
});
