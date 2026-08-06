'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getRegisteredProjects } from '@/lib/chain';
import { filterProjects } from '@/lib/projects/filter';
import { ProjectCardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { shortAddress } from '@/lib/format';
import type { Project } from '@cambium-protocol/sdk';

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: getRegisteredProjects,
  });

  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterProjects(projects ?? [], query),
    [projects, query],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        {projects && projects.length > 0 && (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search methodology, geography, or ID"
            aria-label="Search projects"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-80"
          />
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Failed to load projects from the chain. Check your network and
          contract configuration.
        </div>
      )}

      {projects && projects.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          No projects registered yet.
        </div>
      )}

      {projects && projects.length > 0 && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-gray-200 py-12 text-center">
              <p className="text-gray-500">
                No projects match the current search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-lg border border-gray-200 p-5 transition hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-gray-900">
                      {project.methodology}
                    </h2>
                    <Badge tone="green">v{project.verifyingKeyVersion}</Badge>
                  </div>
                  <dl className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <dt>Geography</dt>
                      <dd>{project.geography}</dd>
                    </div>
                    {project.externalRegistryRef && (
                      <div className="flex justify-between">
                        <dt>Registry Ref</dt>
                        <dd>{project.externalRegistryRef}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt>Project ID</dt>
                      <dd className="font-mono text-xs">
                        {shortAddress(project.id, 10, 6)}
                      </dd>
                    </div>
                  </dl>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
