'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getRetirementLedger } from '@/lib/chain';
import { ProjectCardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { formatAmount, formatDate, shortAddress } from '@/lib/format';
import type { RetirementRecord } from '@cambium-protocol/sdk';

export default function LedgerPage() {
  const { data: entries, isLoading, error } = useQuery<RetirementRecord[]>({
    queryKey: ['ledger'],
    queryFn: getRetirementLedger,
  });

  const totalRetired = entries?.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Retirement Ledger</h1>
        <p className="mt-1 text-sm text-gray-500">
          Public record of all retired carbon credits. Every retirement is
          independently verifiable on-chain.
        </p>
      </div>

      {entries && entries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Retirements"
            value={entries.length.toLocaleString()}
          />
          <StatCard
            label="Total Retired"
            value={`${formatAmount(totalRetired?.toString() ?? '0')} tCO2e`}
          />
          <StatCard
            label="Projects Retired Against"
            value={new Set(entries.map((e) => e.projectId)).size.toLocaleString()}
          />
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Failed to load retirement ledger from the chain. Check your network
          connection and contract configuration.
        </div>
      )}

      {entries && entries.length === 0 && (
        <div className="rounded-lg border border-gray-200 py-12 text-center">
          <p className="text-gray-500">
            No retirement records found in the scanned ledger range.
          </p>
          <Link
            href="/retire"
            className="mt-4 inline-block text-sm font-medium text-green-600 hover:text-green-700"
          >
            Retire your first credits
          </Link>
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Retirement ID</th>
                <th className="px-4 py-3 font-medium text-gray-500">Project</th>
                <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 font-medium text-gray-500">Vintage</th>
                <th className="px-4 py-3 font-medium text-gray-500">Retired By</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-xs text-gray-600"
                      title={entry.id}
                    >
                      {shortAddress(entry.id, 10, 6)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${entry.projectId}`}
                      className="font-medium text-green-600 hover:text-green-700"
                    >
                      {shortAddress(entry.projectId, 10, 6)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatAmount(entry.amount)} tCO2e
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.vintageYear}</td>
                  <td className="px-4 py-3">
                    {entry.retiree.type === 'public' ? (
                      <span
                        className="font-mono text-xs text-gray-600"
                        title={entry.retiree.address}
                      >
                        {shortAddress(entry.retiree.address)}
                      </span>
                    ) : (
                      <Badge tone="violet">Shielded</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(entry.retiredAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
