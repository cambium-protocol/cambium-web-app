'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getRetirementLedger } from '@/lib/chain';
import { filterRetirementRecords, availableVintageYears } from '@/lib/ledger/filter';
import { ProjectCardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { formatAmount, formatDate, shortAddress } from '@/lib/format';
import type { RetirementRecord } from '@cambium-protocol/sdk';

const selectClass =
  'rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700';

const PAGE_SIZE = 20;

export default function LedgerPage() {
  const { data: entries, isLoading, error } = useQuery<RetirementRecord[]>({
    queryKey: ['ledger'],
    queryFn: getRetirementLedger,
  });

  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [retireeType, setRetireeType] = useState<'all' | 'public' | 'shielded'>('all');
  const [minAmount, setMinAmount] = useState('');
  const [page, setPage] = useState(1);

  const years = useMemo(
    () => availableVintageYears(entries ?? []),
    [entries],
  );

  const filtered = useMemo(
    () =>
      filterRetirementRecords(entries ?? [], {
        search,
        vintageYear: year ? Number(year) : undefined,
        retireeType,
        minAmount: minAmount ? Number(minAmount) : undefined,
      }),
    [entries, search, year, retireeType, minAmount],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, year, retireeType, minAmount]);

  const totalRetired = filtered.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );
  const hasFilters = !!(search || year || retireeType !== 'all' || minAmount);

  function resetFilters() {
    setSearch('');
    setYear('');
    setRetireeType('all');
    setMinAmount('');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Retirement Ledger</h1>
        <p className="mt-1 text-sm text-gray-500">
          Public record of all retired carbon credits. Every retirement is
          independently verifiable on-chain.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Machine-readable:{' '}
          <Link
            href="/api/ledger"
            className="font-mono text-green-600 hover:text-green-700"
          >
            /api/ledger
          </Link>{' '}
          · verify one record:{' '}
          <span className="font-mono">/api/retirements/&lt;id&gt;</span>
        </p>
        <div className="mt-3 flex gap-3">
          <a
            href="/api/ledger?format=csv"
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-400"
          >
            Export all (CSV)
          </a>
          <Link
            href="/api/stats"
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-400"
          >
            Protocol stats (JSON)
          </Link>
        </div>
      </div>

      {entries && entries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Retirements"
            value={entries.length.toLocaleString()}
          />
          <StatCard
            label="Total Retired"
            value={`${formatAmount(totalRetired.toString())} tCO2e`}
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
        <>
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4">
            <div className="min-w-[16rem] flex-1">
              <label
                htmlFor="ledger-search"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Search
              </label>
              <input
                id="ledger-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Retirement, project, or retiree address"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="ledger-year"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Vintage Year
              </label>
              <select
                id="ledger-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={selectClass}
              >
                <option value="">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ledger-type"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Retiree Type
              </label>
              <select
                id="ledger-type"
                value={retireeType}
                onChange={(e) =>
                  setRetireeType(e.target.value as 'all' | 'public' | 'shielded')
                }
                className={selectClass}
              >
                <option value="all">All</option>
                <option value="public">Public</option>
                <option value="shielded">Shielded</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ledger-min-amount"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Min. Amount (tCO2e)
              </label>
              <input
                id="ledger-min-amount"
                type="number"
                min="0"
                step="0.001"
                value={minAmount}
                onChange={(e) => {
                  if (e.target.value === '' || Number(e.target.value) >= 0) {
                    setMinAmount(e.target.value);
                  }
                }}
                placeholder="0"
                className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Clear filters
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-900">
              {filtered.length}
            </span>{' '}
            of {entries.length} retirements
          </p>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-gray-200 py-10 text-center">
              <p className="text-gray-500">
                No retirements match the current filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Retirement ID
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Project
                      </th>
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
                      <th className="px-4 py-3 font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginated.map((entry) => (
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
                        <td className="px-4 py-3 text-gray-600">
                          {entry.vintageYear}
                        </td>
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
                        <td className="px-4 py-3">
                          <div className="flex gap-3 whitespace-nowrap text-xs">
                            <a
                              href={`/api/retirements/${entry.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-green-600 hover:text-green-700"
                            >
                              Verify
                            </a>
                            <a
                              href={`/api/certificates/${entry.id}`}
                              className="font-medium text-green-600 hover:text-green-700"
                            >
                              PDF
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-500">
                  Page {safePage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
