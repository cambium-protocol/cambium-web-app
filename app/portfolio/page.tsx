'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getCambiumClient } from '@/lib/cambiumClient';
import { getRetirementsByRetiree, getCreditTransfers } from '@/lib/chain';
import { useWallet } from '@/lib/hooks/useWallet';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatAmount, formatDate, shortAddress } from '@/lib/format';
import type { TransferEvent } from '@/lib/chain';

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

  const retirementsQuery = useQuery({
    queryKey: ['retirements', address],
    queryFn: async () => {
      if (!address) return [];
      return getRetirementsByRetiree(address);
    },
    enabled: !!address,
  });

  const activityQuery = useQuery({
    queryKey: ['activity', address],
    queryFn: async () => {
      if (!address) return [];
      return getCreditTransfers(address);
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

  const retirements = retirementsQuery.data ?? [];
  const activity = activityQuery.data ?? [];
  const totalRetired = retirements.reduce(
    (sum, r) => sum + Number(r.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your carbon credits, retirement history, and recent activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Balance"
          value={
            balanceQuery.isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              `${formatAmount(balanceQuery.data ?? '0')} tCO2e`
            )
          }
        />
        <StatCard
          label="Retirements"
          value={retirements.length.toLocaleString()}
          hint="Retired by this wallet"
        />
        <StatCard
          label="Total Retired"
          value={`${formatAmount(totalRetired.toString())} tCO2e`}
          hint="From on-chain retirement events"
        />
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

      <section className="rounded-lg border border-gray-200">
        <header className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold">Retirement History</h2>
        </header>
        <div className="p-6">
          {retirementsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : retirements.length === 0 ? (
            <p className="text-sm text-gray-500">
              No retirements from this wallet yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-500">
                      Retirement ID
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-500">
                      Project
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-500">
                      Amount
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-500">
                      Vintage
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {retirements.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">
                        {shortAddress(r.id, 10, 6)}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/projects/${r.projectId}`}
                          className="font-medium text-green-600 hover:text-green-700"
                        >
                          {shortAddress(r.projectId, 10, 6)}
                        </Link>
                      </td>
                      <td className="px-4 py-2 font-medium">
                        {formatAmount(r.amount)} tCO2e
                      </td>
                      <td className="px-4 py-2 text-gray-600">{r.vintageYear}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {formatDate(r.retiredAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200">
        <header className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </header>
        <div className="p-6">
          {activityQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-gray-500">
              No credit transfers involving this wallet found in the scanned
              range.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-500">
                      Direction
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-500">
                      Counterparty
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-500">
                      Amount
                    </th>
                    <th className="px-4 py-2 font-medium text-gray-500">
                      Ledger
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activity.slice(0, 20).map((transfer: TransferEvent) => {
                    const received = transfer.to.toLowerCase() === address?.toLowerCase();
                    return (
                      <tr key={`${transfer.txHash}-${transfer.from}-${transfer.ledger}`}>
                        <td className="px-4 py-2">
                          {received ? (
                            <Badge tone="green">Received</Badge>
                          ) : (
                            <Badge tone="amber">Sent</Badge>
                          )}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-600">
                          {shortAddress(received ? transfer.from : transfer.to)}
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {formatAmount(transfer.amount)} tCO2e
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          #{transfer.ledger}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
