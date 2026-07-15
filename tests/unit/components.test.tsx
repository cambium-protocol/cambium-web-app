import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Skeleton, ProjectCardSkeleton, ProjectDetailSkeleton } from '@/components/ui/Skeleton';
import { ToastProvider, useToast } from '@/lib/hooks/useToast';
import PortfolioPage from '@/app/portfolio/page';
import LedgerPage from '@/app/ledger/page';
import RetirePage from '@/app/retire/page';

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
  it('renders the ledger title', () => {
    render(withProviders(<LedgerPage />));
    expect(screen.getByText('Retirement Ledger')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(withProviders(<LedgerPage />));
    expect(
      screen.getByText(/Public record of all retired carbon credits/),
    ).toBeInTheDocument();
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
