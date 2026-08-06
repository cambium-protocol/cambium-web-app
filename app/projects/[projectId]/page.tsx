'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getCambiumClient } from '@/lib/cambiumClient';
import {
  fetchVintageSupply,
  availableSupply,
  formatSupply,
} from '@/lib/registry/vintages';
import { ProjectDetailSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { shortAddress } from '@/lib/format';
import type { Project, Vintage } from '@cambium-protocol/sdk';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const projectQuery = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const client = getCambiumClient();
      return client.registry.getProject(projectId);
    },
    enabled: !!projectId,
  });

  const vintagesQuery = useQuery<Vintage[]>({
    queryKey: ['vintages', projectId],
    queryFn: async () => {
      const client = getCambiumClient();
      return fetchVintageSupply((year) =>
        client.registry.getVintage(projectId, year),
      );
    },
    enabled: !!projectId,
  });

  if (projectQuery.isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (projectQuery.error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        Failed to load project details from the chain.
      </div>
    );
  }

  const project = projectQuery.data;
  if (!project) {
    return (
      <div className="py-12 text-center text-gray-500">Project not found.</div>
    );
  }

  const vintages = vintagesQuery.data ?? [];
  const totalAvailable = vintages.reduce(
    (sum, v) => sum + availableSupply(v),
    BigInt(0),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">
          {project.methodology}
        </h1>
        <p className="font-mono text-sm text-gray-500">
          {shortAddress(project.id, 12, 8)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="mb-4 text-lg font-semibold">Project Info</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Methodology</dt>
              <dd className="font-medium">{project.methodology}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Geography</dt>
              <dd className="font-medium">{project.geography}</dd>
            </div>
            {project.externalRegistryRef && (
              <div className="flex justify-between">
                <dt className="text-gray-500">External Registry Ref</dt>
                <dd className="font-medium">{project.externalRegistryRef}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Verifying Key Version</dt>
              <dd>
                <Badge tone="green">v{project.verifyingKeyVersion}</Badge>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="mb-4 text-lg font-semibold">Proof Transparency</h2>
          <p className="text-sm text-gray-600">
            This project&apos;s MRV proof status, methodology version, and
            verifying key are read directly from the on-chain registry — they
            can never drift from the contract&apos;s state.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Available Supply</dt>
              <dd className="font-medium">
                {formatSupply(totalAvailable)} tCO2e
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Vintages</dt>
              <dd className="font-medium">{vintages.length}</dd>
            </div>
          </dl>
        </section>
      </div>

      {vintagesQuery.isLoading && (
        <div className="rounded-lg border border-gray-200 p-6">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
        </div>
      )}

      {vintages.length > 0 && (
        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="mb-4 text-lg font-semibold">Vintage Supply</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-500">Vintage</th>
                  <th className="px-4 py-2 font-medium text-gray-500">
                    Total Issued
                  </th>
                  <th className="px-4 py-2 font-medium text-gray-500">
                    Total Retired
                  </th>
                  <th className="px-4 py-2 font-medium text-gray-500">
                    Available
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vintages.map((vintage) => (
                  <tr key={vintage.year}>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {vintage.year}
                    </td>
                    <td className="px-4 py-2">{vintage.totalIssued} tCO2e</td>
                    <td className="px-4 py-2">{vintage.totalRetired} tCO2e</td>
                    <td className="px-4 py-2 font-medium">
                      {formatSupply(availableSupply(vintage))} tCO2e
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex gap-4">
        <Link
          href="/trade"
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Buy Credits
        </Link>
        <Link
          href={`/retire?projectId=${encodeURIComponent(project.id)}`}
          className="rounded-md border border-green-600 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
        >
          Retire Credits
        </Link>
      </div>
    </div>
  );
}
