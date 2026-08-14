import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '@/app/page';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';

vi.mock('@/lib/chain', () => ({
  getProtocolStats: vi.fn(),
  getRetirementLedger: vi.fn(),
}));

import { getProtocolStats, getRetirementLedger } from '@/lib/chain';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function withProviders(ui: React.ReactNode) {
  return <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;
}

describe('Home page', () => {
  beforeEach(() => {
    vi.mocked(getProtocolStats).mockReset();
    vi.mocked(getRetirementLedger).mockReset();
  });

  it('renders the hero and feature links', () => {
    vi.mocked(getProtocolStats).mockResolvedValue({
      totalRetirements: 0,
      totalRetired: '0',
      projectsRegistered: 0,
      projectsRetiredAgainst: 0,
      shieldedRetirements: 0,
      latestLedger: 1,
    });
    vi.mocked(getRetirementLedger).mockResolvedValue([]);
    render(withProviders(<HomePage />));
    expect(screen.getByText('Cambium Protocol')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Trade')).toBeInTheDocument();
    expect(screen.getByText('Retire')).toBeInTheDocument();
    expect(screen.getByText('Ledger')).toBeInTheDocument();
  });

  it('shows live protocol stats once loaded', async () => {
    vi.mocked(getProtocolStats).mockResolvedValue({
      totalRetirements: 42,
      totalRetired: '153.5',
      projectsRegistered: 7,
      projectsRetiredAgainst: 4,
      shieldedRetirements: 3,
      latestLedger: 1_234_567,
    });
    vi.mocked(getRetirementLedger).mockResolvedValue([]);
    render(withProviders(<HomePage />));

    await waitFor(() => {
      expect(screen.getByText('Total Retired')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/153\.5 tCO2e/)).toBeInTheDocument();
    });
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('lists the most recent retirements with a link to the full ledger', async () => {
    vi.mocked(getProtocolStats).mockResolvedValue({
      totalRetirements: 1,
      totalRetired: '1.5',
      projectsRegistered: 1,
      projectsRetiredAgainst: 1,
      shieldedRetirements: 0,
      latestLedger: 100,
    });
    vi.mocked(getRetirementLedger).mockResolvedValue([
      {
        id: 'ret-1',
        projectId: ACCOUNT,
        vintageYear: 2025,
        amount: '1.5',
        retiredAt: 1712345678,
        retiree: { type: 'public', address: ACCOUNT },
      },
    ]);
    render(withProviders(<HomePage />));

    await waitFor(() => {
      expect(screen.getByText('Recent Retirements')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getAllByText(/1\.5 tCO2e/).length).toBeGreaterThan(0);
    });
    const ledgerLink = screen.getByRole('link', {
      name: 'View full ledger',
    });
    expect(ledgerLink).toHaveAttribute('href', '/ledger');
  });

  it('handles a protocol with no retirements yet', async () => {
    vi.mocked(getProtocolStats).mockResolvedValue({
      totalRetirements: 0,
      totalRetired: '0',
      projectsRegistered: 0,
      projectsRetiredAgainst: 0,
      shieldedRetirements: 0,
      latestLedger: 1,
    });
    vi.mocked(getRetirementLedger).mockResolvedValue([]);
    render(withProviders(<HomePage />));

    await waitFor(() => {
      expect(
        screen.getByText(/No retirement records found in the scanned ledger range yet/),
      ).toBeInTheDocument();
    });
  });
});
