'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCambiumClient } from '@/lib/cambiumClient';
import { useWallet } from '@/lib/hooks/useWallet';
import { useToast } from '@/lib/hooks/useToast';
import type { Quote } from '@cambium-protocol/sdk';

export default function TradePage() {
  const { connected, address, signTransaction } = useWallet();
  const { addToast } = useToast();
  const [poolId, setPoolId] = useState('');
  const [amountIn, setAmountIn] = useState('');

  const quoteQuery = useQuery<Quote>({
    queryKey: ['quote', poolId, amountIn],
    queryFn: async () => {
      const client = getCambiumClient();
      return client.marketplace.quote({ poolId, amountIn });
    },
    enabled: !!poolId && !!amountIn && BigInt(amountIn) > BigInt(0),
  });

  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Wallet not connected');
      const client = getCambiumClient();
      const tx = await client.marketplace.swap({
        poolId,
        amountIn,
        minAmountOut: quoteQuery.data?.amountOut || '0',
        trader: address,
      });
      const signedXdr = await signTransaction(tx.toXDR());
      const result = await client.submit(signedXdr);
      return result;
    },
    onSuccess: () => {
      addToast('success', 'Swap submitted successfully.');
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
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Amount (credits)
          </label>
          <input
            type="text"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {quoteQuery.data && (
          <div className="rounded-md bg-gray-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Estimated Output</span>
              <span className="font-medium">{quoteQuery.data.amountOut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Price Impact</span>
              <span className="font-medium">{quoteQuery.data.priceImpact}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => swapMutation.mutate()}
          disabled={!connected || !poolId || !amountIn || swapMutation.isPending}
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
