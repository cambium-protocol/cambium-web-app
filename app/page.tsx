'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getProtocolStats, getRetirementLedger } from '@/lib/chain';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { formatAmount, formatDate, shortAddress } from '@/lib/format';

const FEATURES = [
  {
    href: '/projects',
    title: 'Projects',
    description:
      'Explore registered carbon projects by methodology and geography.',
  },
  {
    href: '/trade',
    title: 'Trade',
    description: 'Swap credits via AMM pools with live price quotes.',
  },
  {
    href: '/retire',
    title: 'Retire',
    description: 'Permanently retire credits for verifiable carbon offsets.',
  },
  {
    href: '/portfolio',
    title: 'Portfolio',
    description: 'Track your held, traded, and retired credits.',
  },
  {
    href: '/ledger',
    title: 'Ledger',
    description: 'Audit every public retirement on the protocol.',
  },
];

export default function HomePage() {
  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: getProtocolStats,
  });

  const recentQuery = useQuery({
    queryKey: ['ledger'],
    queryFn: getRetirementLedger,
  });

  const stats = statsQuery.data;
  const recent = (recentQuery.data ?? []).slice(0, 5);

  return (
    <div className="flex flex-col items-center gap-12 py-16">
      <section className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          Cambium Protocol
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          A transparent, on-chain carbon credit marketplace built on
          Stellar/Soroban. Browse verified projects, trade credits with minimal
          friction, and retire offsets with cryptographic proof of legitimacy.
        </p>
      </section>

      <section className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Retired"
          value={
            statsQuery.isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              `${formatAmount(stats?.totalRetired ?? '0')} tCO2e`
            )
          }
        />
        <StatCard
          label="Retirements"
          value={
            statsQuery.isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              (stats?.totalRetirements ?? 0).toLocaleString()
            )
          }
        />
        <StatCard
          label="Projects Registered"
          value={
            statsQuery.isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              (stats?.projectsRegistered ?? 0).toLocaleString()
            )
          }
        />
      </section>

      <section className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="rounded-lg border border-gray-200 p-6 text-center transition hover:shadow-md"
          >
            <h2 className="mb-2 text-lg font-semibold">{feature.title}</h2>
            <p className="text-sm text-gray-500">{feature.description}</p>
          </Link>
        ))}
      </section>

      <section className="w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Retirements
          </h2>
          <Link
            href="/ledger"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            View full ledger
          </Link>
        </div>

        {recentQuery.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!recentQuery.isLoading && recent.length === 0 && (
          <div className="rounded-lg border border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-500">
              No retirement records found in the scanned ledger range yet.
            </p>
          </div>
        )}

        {recent.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Vintage
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Retired By
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recent.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 font-medium">
                      {formatAmount(entry.amount)} tCO2e
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {entry.vintageYear}
                    </td>
                    <td className="px-4 py-3">
                      {entry.retiree.type === 'public' ? (
                        <span className="font-mono text-xs text-gray-600">
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
      </section>

      <section className="max-w-2xl text-center text-sm text-gray-500">
        <p>
          Cambium Protocol uses zero-knowledge proofs and on-chain verification
          to ensure every credit is backed by real, additional, and permanent
          carbon sequestration. All retirement records are public and
          independently verifiable.
        </p>
      </section>
    </div>
  );
}
