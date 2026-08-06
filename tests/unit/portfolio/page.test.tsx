import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PortfolioPage from '@/app/portfolio/page';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';
const OTHER = 'GAT3G5MSCEPXNB4DIMZS2LLVZTPCHBUFEQV3TEGZLBWXOMSNV3V6U2OG';

vi.mock('@/lib/hooks/useWallet', () => ({
  useWallet: vi.fn(),
}));

vi.mock('@/lib/chain', () => ({
  getRetirementsByRetiree: vi.fn(),
  getCreditTransfers: vi.fn(),
}));

vi.mock('@/lib/cambiumClient', () => ({
  getCambiumClient: vi.fn(),
}));

import { useWallet } from '@/lib/hooks/useWallet';
import { getRetirementsByRetiree, getCreditTransfers } from '@/lib/chain';
import { getCambiumClient } from '@/lib/cambiumClient';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function withProviders(ui: React.ReactNode) {
  return <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;
}

describe('Portfolio page', () => {
  beforeEach(() => {
    vi.mocked(getRetirementsByRetiree).mockReset();
    vi.mocked(getCreditTransfers).mockReset();
    vi.mocked(getCambiumClient).mockReset();
  });

  it('prompts to connect when no wallet is connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      address: null,
      loading: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
    });
    render(withProviders(<PortfolioPage />));
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(
      screen.getByText('Connect your wallet to view your carbon credit holdings.'),
    ).toBeInTheDocument();
  });

  it('shows balance, retirement history, and activity when connected', async () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      address: ACCOUNT,
      loading: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
    });
    vi.mocked(getCambiumClient).mockReturnValue({
      credits: { balanceOf: vi.fn(async () => '1.5') },
    } as any);
    vi.mocked(getRetirementsByRetiree).mockResolvedValue([
      {
        id: 'ret-1',
        projectId: ACCOUNT,
        vintageYear: 2025,
        amount: '1',
        retiredAt: 1712345678,
        retiree: { type: 'public', address: ACCOUNT },
      },
    ]);
    vi.mocked(getCreditTransfers).mockResolvedValue([
      {
        kind: 'transfer',
        from: OTHER,
        to: ACCOUNT,
        amount: '2',
        txHash: 'tx-1',
        ledger: 1000,
        ledgerClosedAt: '2025-01-01T00:00:00Z',
      },
    ]);

    render(withProviders(<PortfolioPage />));

    await waitFor(() => {
      expect(screen.getByText(/1\.5 tCO2e/)).toBeInTheDocument();
    });
    expect(screen.getByText('Retirement History')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Received')).toBeInTheDocument();
  });
});
