'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getCambiumClient } from '@/lib/cambiumClient';
import { ProjectCardSkeleton } from '@/components/ui/Skeleton';
import type { Project } from '@cambium-protocol/sdk';

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const client = getCambiumClient();
      return client.registry.listProjects();
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Projects</h1>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Failed to load projects. Check your network and contract configuration.
        </div>
      )}

      {projects && projects.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          No projects registered yet.
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-lg border border-gray-200 p-5 transition hover:shadow-md"
            >
              <h2 className="mb-2 font-semibold text-gray-900">
                {project.methodology}
              </h2>
              <dl className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <dt>Geography</dt>
                  <dd>{project.geography}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Verifying Key</dt>
                  <dd>v{project.verifyingKeyVersion}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Project ID</dt>
                  <dd className="font-mono text-xs">{project.id.slice(0, 12)}...</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
