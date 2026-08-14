'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getRegisteredProjects } from '@/lib/chain';
import {
  filterProjects,
  availableMethodologies,
  availableGeographies,
} from '@/lib/projects/filter';
import { ProjectCardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { shortAddress } from '@/lib/format';
import type { Project } from '@cambium-protocol/sdk';

const selectClass =
  'rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700';

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: getRegisteredProjects,
  });

  const [query, setQuery] = useState('');
  const [methodology, setMethodology] = useState('');
  const [geography, setGeography] = useState('');

  const methodologies = useMemo(
    () => availableMethodologies(projects ?? []),
    [projects],
  );
  const geographies = useMemo(
    () => availableGeographies(projects ?? []),
    [projects],
  );

  const filtered = useMemo(
    () =>
      filterProjects(projects ?? [], query, { methodology, geography }),
    [projects, query, methodology, geography],
  );

  const hasFilters = !!(query || methodology || geography);

  function resetFilters() {
    setQuery('');
    setMethodology('');
    setGeography('');
  }

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
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4">
            <div>
              <label
                htmlFor="projects-methodology"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Methodology
              </label>
              <select
                id="projects-methodology"
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                className={selectClass}
              >
                <option value="">All methodologies</option>
                {methodologies.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="projects-geography"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Geography
              </label>
              <select
                id="projects-geography"
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                className={selectClass}
              >
                <option value="">All geographies</option>
                {geographies.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
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
            <span className="font-medium text-gray-900">{filtered.length}</span>{' '}
            of {projects.length} projects
          </p>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-gray-200 py-12 text-center">
              <p className="text-gray-500">
                No projects match the current filters.
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
