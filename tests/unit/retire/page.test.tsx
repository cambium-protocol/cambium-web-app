import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RetirePage from '@/app/retire/page';

const ACCOUNT = 'GD5ATW7EKDOTEDZRKLRBO4CBORU5BAX5HND3KRCAPM3AS4JMB5MHK7BJ';
const PROJECT = 'GAT3G5MSCEPXNB4DIMZS2LLVZTPCHBUFEQV3TEGZLBWXOMSNV3V6U2OG';

vi.mock('@/lib/hooks/useWallet', () => ({
  useWallet: vi.fn(),
}));

vi.mock('@/lib/hooks/useToast', () => ({
  useToast: vi.fn(() => ({ addToast: vi.fn() })),
}));

vi.mock('@/lib/cambiumClient', () => ({
  getCambiumClient: vi.fn(),
}));

vi.mock('@/lib/chain', () => ({
  getRetirementByTxHash: vi.fn(),
}));

import { useWallet } from '@/lib/hooks/useWallet';
import { getCambiumClient } from '@/lib/cambiumClient';
import { getRetirementByTxHash } from '@/lib/chain';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function withProviders(ui: React.ReactNode) {
  return <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>;
}

describe('Retire page', () => {
  beforeEach(() => {
    vi.mocked(getCambiumClient).mockReset();
    vi.mocked(getRetirementByTxHash).mockReset();
    vi.mocked(getRetirementByTxHash).mockResolvedValue(null);
  });

  it('requires a connected wallet before retiring', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      address: null,
      loading: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
    });
    render(withProviders(<RetirePage />));
    expect(screen.getByText('Connect Wallet First')).toBeDisabled();
  });

  it('submits a retirement and captures the on-chain record in the confirmation', async () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      address: ACCOUNT,
      loading: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(async () => 'signed-xdr'),
    });

    const client = {
      retirement: {
        retire: vi.fn(async () => ({ toXDR: () => 'unsigned-xdr' })),
      },
      submit: vi.fn(async () => ({ hash: 'tx-hash-123' })),
      registry: {
        getProject: vi.fn(async () => ({
          id: PROJECT,
          methodology: 'Verra VM001',
        })),
      },
    };
    vi.mocked(getCambiumClient).mockReturnValue(client as any);
    vi.mocked(getRetirementByTxHash).mockResolvedValue({
      id: 'record-1',
      projectId: PROJECT,
      vintageYear: 2025,
      amount: '1',
      retiredAt: 1712345678,
      retiree: { type: 'public', address: ACCOUNT },
    });

    render(withProviders(<RetirePage />));

    fireEvent.change(screen.getByPlaceholderText('0x...'), {
      target: { value: PROJECT },
    });
    fireEvent.change(screen.getByPlaceholderText('2025'), {
      target: { value: '2025' },
    });
    fireEvent.change(screen.getByPlaceholderText('0'), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retire' }));

    await waitFor(() => {
      expect(client.retirement.retire).toHaveBeenCalledWith({
        from: ACCOUNT,
        projectId: PROJECT,
        vintageYear: 2025,
        amount: '1',
        shield: false,
      });
      expect(client.submit).toHaveBeenCalledWith('signed-xdr');
    });

    await waitFor(() => {
      expect(getRetirementByTxHash).toHaveBeenCalledWith('tx-hash-123');
      expect(screen.getByText('Retirement submitted.')).toBeInTheDocument();
    });
    expect(screen.getByText(/1 tCO2e/)).toBeInTheDocument();
  });
});
