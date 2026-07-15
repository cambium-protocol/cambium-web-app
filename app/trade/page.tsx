'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCambiumClient } from '@/lib/cambiumClient';
import { useWallet } from '@/lib/hooks/useWallet';
import { useToast } from '@/lib/hooks/useToast';
import type { Quote } from '@cambium-protocol/sdk';

const SLIPPAGE_OPTIONS = ['0.5', '1', '3'];

function isValidNumber(value: string): boolean {
  if (!value) return false;
  const num = Number(value);
  return !isNaN(num) && num > 0 && /^\d*\.?\d*$/.test(value);
}

export default function TradePage() {
  const { connected, address, signTransaction } = useWallet();
  const { addToast } = useToast();
  const [poolId, setPoolId] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState('1');
  const [showSlippageMenu, setShowSlippageMenu] = useState(false);

  const poolIdValid = poolId.length > 0;
  const amountValid = isValidNumber(amountIn);

  const quoteQuery = useQuery<Quote>({
    queryKey: ['quote', poolId, amountIn],
    queryFn: async () => {
      const client = getCambiumClient();
      return client.marketplace.quote({ poolId, amountIn });
    },
    enabled: poolIdValid && amountValid && BigInt(amountIn) > BigInt(0),
  });

  const minAmountOut = useMemo(() => {
    if (!quoteQuery.data?.amountOut) return '0';
    const out = BigInt(quoteQuery.data.amountOut);
    const slippageFactor = BigInt(Math.floor((100 - Number(slippage)) * 100));
    return (out * slippageFactor / BigInt(10000)).toString();
  }, [quoteQuery.data?.amountOut, slippage]);

  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Wallet not connected');
      const client = getCambiumClient();
      const tx = await client.marketplace.swap({
        poolId,
        amountIn,
        minAmountOut,
        trader: address,
      });
      const signedXdr = await signTransaction(tx.toXDR());
      const result = await client.submit(signedXdr);
      return result;
    },
    onSuccess: () => {
      addToast('success', 'Swap submitted successfully.');
      setAmountIn('');
    },
    onError: (err: Error) => {
      addToast('error', err.message);
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Trade</h1>

      <div className="space-y-4 rounded-lg border border-gray-200 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Pool ID
          </label>
          <input
            type="text"
            value={poolId}
            onChange={(e) => setPoolId(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {poolId.length > 0 && !poolIdValid && (
            <p className="mt-1 text-xs text-red-600">Pool ID is required</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Amount (credits)
          </label>
          <input
            type="text"
            value={amountIn}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setAmountIn(val);
              }
            }}
            placeholder="0"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {amountIn.length > 0 && !amountValid && (
            <p className="mt-1 text-xs text-red-600">
              Enter a valid positive number
            </p>
          )}
        </div>

        <div className="relative">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Slippage Tolerance
          </label>
          <button
            onClick={() => setShowSlippageMenu(!showSlippageMenu)}
            className="flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400"
          >
            <span>{slippage}%</span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${showSlippageMenu ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showSlippageMenu && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {SLIPPAGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSlippage(option);
                    setShowSlippageMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    slippage === option ? 'font-medium text-green-600' : 'text-gray-700'
                  }`}
                >
                  {option}%
                </button>
              ))}
            </div>
          )}
        </div>

        {quoteQuery.data && (
          <div className="rounded-md bg-gray-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Estimated Output</span>
              <span className="font-medium">{quoteQuery.data.amountOut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Min. Received ({slippage}% slippage)</span>
              <span className="font-medium">{minAmountOut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Price Impact</span>
              <span className="font-medium">{quoteQuery.data.priceImpact}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => swapMutation.mutate()}
          disabled={!connected || !poolIdValid || !amountValid || swapMutation.isPending}
          className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!connected
            ? 'Connect Wallet First'
            : swapMutation.isPending
              ? 'Swapping...'
              : 'Swap'}
        </button>
      </div>
    </div>
  );
}
