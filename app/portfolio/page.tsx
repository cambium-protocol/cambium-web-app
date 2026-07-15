'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getCambiumClient } from '@/lib/cambiumClient';
import { useWallet } from '@/lib/hooks/useWallet';

export default function PortfolioPage() {
  const { connected, address } = useWallet();

  const balanceQuery = useQuery<string>({
    queryKey: ['balance', address],
    queryFn: async () => {
      const client = getCambiumClient();
      return client.credits.balanceOf(address!);
    },
    enabled: !!address,
  });

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <p className="text-gray-500">
          Connect your wallet to view your carbon credit holdings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your carbon credit balance.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-500">Total Balance</p>
        {balanceQuery.isLoading ? (
          <div className="mt-1 h-8 w-32 animate-pulse rounded bg-gray-200" />
        ) : (
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {balanceQuery.data || '0'} tCO2e
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <Link
          href="/trade"
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Buy Credits
        </Link>
        <Link
          href="/retire"
          className="rounded-md border border-green-600 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
        >
          Retire Credits
        </Link>
      </div>
    </div>
  );
}
