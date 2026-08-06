import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectsPage from '@/app/projects/page';
import type { Project } from '@cambium-protocol/sdk';

vi.mock('@/lib/chain', () => ({
  getRegisteredProjects: vi.fn(),
  getRetirementLedger: vi.fn(),
  getRetirementsByRetiree: vi.fn(),
}));

import { getRegisteredProjects } from '@/lib/chain';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function withProviders(ui: React.ReactNode) {
  return <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;
}

const projects: Project[] = [
  { id: ACCOUNT, methodology: 'ARR', geography: 'Kenya', verifyingKeyVersion: 1 },
];

describe('Projects page', () => {
  beforeEach(() => {
    vi.mocked(getRegisteredProjects).mockReset();
  });

  it('renders the page title and search bar', async () => {
    vi.mocked(getRegisteredProjects).mockResolvedValue(projects);
    render(withProviders(<ProjectsPage />));
    expect(screen.getByText('Projects')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText('Search projects')).toBeInTheDocument();
    });
  });

  it('renders projects returned from the registry events', async () => {
    vi.mocked(getRegisteredProjects).mockResolvedValue(projects);
    render(withProviders(<ProjectsPage />));
    await waitFor(() => {
      expect(screen.getByText('ARR')).toBeInTheDocument();
    });
    expect(screen.getByText('Kenya')).toBeInTheDocument();
  });

  it('filters projects by search query', async () => {
    vi.mocked(getRegisteredProjects).mockResolvedValue(projects);
    render(withProviders(<ProjectsPage />));
    const input = await screen.findByLabelText('Search projects');
    await waitFor(() => {
      expect(screen.getByText('ARR')).toBeInTheDocument();
    });
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(
      screen.getByText(/No projects match the current search/),
    ).toBeInTheDocument();
  });

  it('shows the empty state when no projects are registered', async () => {
    vi.mocked(getRegisteredProjects).mockResolvedValue([]);
    render(withProviders(<ProjectsPage />));
    await waitFor(() => {
      expect(screen.getByText('No projects registered yet.')).toBeInTheDocument();
    });
  });
});
