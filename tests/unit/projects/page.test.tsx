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
  {
    id: 'GA4GASG6WYK6W3FQZPZ4V2EOSVYNCP2DWLDUHMS2B5MX6MYL7G4AFEOR',
    methodology: 'REDD+',
    geography: 'Brazil',
    externalRegistryRef: 'VCS-123',
    verifyingKeyVersion: 2,
  },
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
      expect(screen.getByRole('heading', { name: 'ARR' })).toBeInTheDocument();
    });
    expect(
      screen.getByRole('heading', { name: 'REDD+' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Kenya').length).toBeGreaterThan(0);
  });

  it('filters projects by search query', async () => {
    vi.mocked(getRegisteredProjects).mockResolvedValue(projects);
    render(withProviders(<ProjectsPage />));
    const input = await screen.findByLabelText('Search projects');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ARR' })).toBeInTheDocument();
    });
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(
      screen.getByText(/No projects match the current filters/),
    ).toBeInTheDocument();
  });

  it('shows the empty state when no projects are registered', async () => {
    vi.mocked(getRegisteredProjects).mockResolvedValue([]);
    render(withProviders(<ProjectsPage />));
    await waitFor(() => {
      expect(screen.getByText('No projects registered yet.')).toBeInTheDocument();
    });
  });

  it('filters projects by methodology and geography selects', async () => {
    vi.mocked(getRegisteredProjects).mockResolvedValue(projects);
    render(withProviders(<ProjectsPage />));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ARR' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Methodology'), {
      target: { value: 'REDD+' },
    });
    expect(screen.getByRole('heading', { name: 'REDD+' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'ARR' }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Geography'), {
      target: { value: 'Brazil' },
    });
    expect(
      screen.getByRole('heading', { name: 'REDD+' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'ARR' }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Geography'), {
      target: { value: 'Kenya' },
    });
    expect(
      screen.getByText(/No projects match the current filters/),
    ).toBeInTheDocument();
  });

  it('clears all filters at once', async () => {
    vi.mocked(getRegisteredProjects).mockResolvedValue(projects);
    render(withProviders(<ProjectsPage />));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ARR' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Methodology'), {
      target: { value: 'REDD+' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ARR' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'REDD+' })).toBeInTheDocument();
    });
  });
});
