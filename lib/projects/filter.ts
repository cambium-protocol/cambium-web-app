import type { Project } from '@cambium-protocol/sdk';

/** Case-insensitive match against methodology, geography, ref, and ID. */
export function filterProjects(projects: Project[], query: string): Project[] {
  const q = query.trim().toLowerCase();
  if (!q) return projects;
  return projects.filter((project) => {
    const haystack = [
      project.methodology,
      project.geography,
      project.externalRegistryRef ?? '',
      project.id,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function availableMethodologies(projects: Project[]): string[] {
  return Array.from(
    new Set(projects.map((p) => p.methodology)),
  ).sort((a, b) => a.localeCompare(b));
}

export function availableGeographies(projects: Project[]): string[] {
  return Array.from(
    new Set(projects.map((p) => p.geography)),
  ).sort((a, b) => a.localeCompare(b));
}
