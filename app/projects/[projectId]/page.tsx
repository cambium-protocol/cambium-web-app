'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getCambiumClient } from '@/lib/cambiumClient';
import { ProjectDetailSkeleton } from '@/components/ui/Skeleton';
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

  const vintageQuery = useQuery<Vintage>({
    queryKey: ['vintage', projectId],
    queryFn: async () => {
      const client = getCambiumClient();
      const currentYear = new Date().getFullYear();
      return client.registry.getVintage(projectId, currentYear);
    },
    enabled: !!projectId,
  });

  if (projectQuery.isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (projectQuery.error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        Failed to load project details.
      </div>
    );
  }

  const project = projectQuery.data;
  if (!project) {
    return <div className="py-12 text-center text-gray-500">Project not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">
          {project.methodology}
        </h1>
        <p className="font-mono text-sm text-gray-500">{project.id}</p>
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
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="mb-4 text-lg font-semibold">Proof Transparency</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Methodology Version</dt>
              <dd className="font-medium">{project.methodology}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Verifying Key Version</dt>
              <dd className="font-medium">v{project.verifyingKeyVersion}</dd>
            </div>
          </dl>
        </section>
      </div>

      {vintageQuery.data && (
        <section className="rounded-lg border border-gray-200 p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Vintage {vintageQuery.data.year}
          </h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Total Issued</dt>
              <dd className="text-lg font-semibold">{vintageQuery.data.totalIssued} tCO2e</dd>
            </div>
            <div>
              <dt className="text-gray-500">Total Retired</dt>
              <dd className="text-lg font-semibold">{vintageQuery.data.totalRetired} tCO2e</dd>
            </div>
          </dl>
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
          href="/retire"
          className="rounded-md border border-green-600 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
        >
          Retire Credits
        </Link>
      </div>
    </div>
  );
}
