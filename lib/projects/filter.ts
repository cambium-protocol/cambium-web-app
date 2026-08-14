import type { Project } from '@cambium-protocol/sdk';

export interface ProjectFilters {
  methodology?: string;
  geography?: string;
}

/** Case-insensitive match against methodology, geography, ref, and ID. */
export function filterProjects(
  projects: Project[],
  query: string,
  filters: ProjectFilters = {},
): Project[] {
  const q = query.trim().toLowerCase();
  return projects.filter((project) => {
    if (filters.methodology && project.methodology !== filters.methodology) {
      return false;
    }
    if (filters.geography && project.geography !== filters.geography) {
      return false;
    }
    if (q) {
      const haystack = [
        project.methodology,
        project.geography,
        project.externalRegistryRef ?? '',
        project.id,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
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
