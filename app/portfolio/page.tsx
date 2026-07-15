'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getCambiumClient } from '@/lib/cambiumClient';
import { useWallet } from '@/lib/hooks/useWallet';
import { ProjectCardSkeleton } from '@/components/ui/Skeleton';

interface PortfolioHolding {
  projectId: string;
  methodology: string;
  vintageYear: number;
  balance: string;
  retired: string;
}

export default function PortfolioPage() {
  const { connected, address } = useWallet();

  const { data: holdings, isLoading } = useQuery<PortfolioHolding[]>({
    queryKey: ['portfolio', address],
    queryFn: async () => {
      const client = getCambiumClient();
      return client.portfolio.getHoldings(address!);
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
          Your carbon credit holdings and retirement summary.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {holdings && holdings.length === 0 && (
        <div className="rounded-lg border border-gray-200 py-12 text-center">
          <p className="text-gray-500">No credits in your portfolio yet.</p>
          <Link
            href="/trade"
            className="mt-4 inline-block text-sm font-medium text-green-600 hover:text-green-700"
          >
            Browse the marketplace
          </Link>
        </div>
      )}

      {holdings && holdings.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-gray-500">Total Holdings</p>
              <p className="text-2xl font-bold text-gray-900">
                {holdings.reduce((sum, h) => sum + Number(h.balance), 0)} tCO2e
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-gray-500">Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(holdings.map((h) => h.projectId)).size}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-gray-500">Retired</p>
              <p className="text-2xl font-bold text-gray-900">
                {holdings.reduce((sum, h) => sum + Number(h.retired), 0)} tCO2e
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500">Project</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Vintage</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Balance</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Retired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holdings.map((holding) => (
                  <tr key={`${holding.projectId}-${holding.vintageYear}`}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${holding.projectId}`}
                        className="font-medium text-green-600 hover:text-green-700"
                      >
                        {holding.methodology}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{holding.vintageYear}</td>
                    <td className="px-4 py-3 font-medium">{holding.balance} tCO2e</td>
                    <td className="px-4 py-3 text-gray-600">{holding.retired} tCO2e</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
