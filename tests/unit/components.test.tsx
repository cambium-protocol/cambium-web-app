import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Skeleton, ProjectCardSkeleton, ProjectDetailSkeleton } from '@/components/ui/Skeleton';
import { ToastProvider } from '@/lib/hooks/useToast';
import PortfolioPage from '@/app/portfolio/page';
import LedgerPage from '@/app/ledger/page';
import RetirePage from '@/app/retire/page';

vi.mock('@/lib/chain', () => ({
  getRetirementLedger: vi.fn(),
  getRegisteredProjects: vi.fn(),
  getRetirementsByRetiree: vi.fn(),
}));

import { getRetirementLedger } from '@/lib/chain';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function withProviders(ui: React.ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>
  );
}

describe('Skeleton components', () => {
  it('renders Skeleton with default class', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('bg-gray-200');
  });

  it('renders Skeleton with custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-1/2" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-1/2');
  });

  it('renders ProjectCardSkeleton', () => {
    const { container } = render(<ProjectCardSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders ProjectDetailSkeleton', () => {
    const { container } = render(<ProjectDetailSkeleton />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('Toast system', () => {
  it('renders toast provider without crashing', () => {
    render(withProviders(<div>test</div>));
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});

describe('Portfolio page', () => {
  it('shows connect wallet prompt when disconnected', () => {
    render(withProviders(<PortfolioPage />));
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(
      screen.getByText('Connect your wallet to view your carbon credit holdings.'),
    ).toBeInTheDocument();
  });
});

describe('Ledger page', () => {
  beforeEach(() => {
    vi.mocked(getRetirementLedger).mockReset();
  });

  it('renders the ledger title', () => {
    vi.mocked(getRetirementLedger).mockResolvedValue([]);
    render(withProviders(<LedgerPage />));
    expect(screen.getByText('Retirement Ledger')).toBeInTheDocument();
  });

  it('shows description text', () => {
    vi.mocked(getRetirementLedger).mockResolvedValue([]);
    render(withProviders(<LedgerPage />));
    expect(
      screen.getByText(/Public record of all retired carbon credits/),
    ).toBeInTheDocument();
  });

  it('renders retirement records from on-chain events', async () => {
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
    render(withProviders(<LedgerPage />));
    await waitFor(() => {
      expect(screen.getByText('Total Retirements')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/1\.5 tCO2e/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('2025').length).toBeGreaterThan(0);
  });

  it('shows the empty state when there are no records', async () => {
    vi.mocked(getRetirementLedger).mockResolvedValue([]);
    render(withProviders(<LedgerPage />));
    await waitFor(() => {
      expect(
        screen.getByText(/No retirement records found in the scanned ledger range/),
      ).toBeInTheDocument();
    });
  });
});

describe('Retire page', () => {
  it('renders the retire form', () => {
    render(withProviders(<RetirePage />));
    expect(screen.getByText('Retire Credits')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet First')).toBeInTheDocument();
  });

  it('disables retire button when form is empty', () => {
    render(withProviders(<RetirePage />));
    const button = screen.getByRole('button', { name: /connect wallet first/i });
    expect(button).toBeDisabled();
  });
});
