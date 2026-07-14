import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import HomePage from '@/app/page';
import ProjectsPage from '@/app/projects/page';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function withQueryClient(ui: React.ReactNode) {
  return <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;
}

describe('ConnectWallet', () => {
  it('renders connect button when disconnected', () => {
    render(withQueryClient(<ConnectWallet />));
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });
});

describe('Landing page', () => {
  it('renders the protocol title', () => {
    render(withQueryClient(<HomePage />));
    expect(screen.getByText('Cambium Protocol')).toBeInTheDocument();
  });

  it('renders quick links', () => {
    render(withQueryClient(<HomePage />));
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Trade')).toBeInTheDocument();
    expect(screen.getByText('Retire')).toBeInTheDocument();
  });
});

describe('Project explorer', () => {
  it('shows loading state', () => {
    render(withQueryClient(<ProjectsPage />));
    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
  });
});
