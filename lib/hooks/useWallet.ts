'use client';
import { useState, useCallback } from 'react';

interface WalletState {
  connected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).freighter) {
      try {
        const freighter = (window as any).freighter;
        const addr = await freighter.getAddress();
        setAddress(addr);
      } catch (e) {
        console.error('Failed to connect wallet:', e);
      }
    } else {
      console.warn('Freighter wallet not detected');
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!address) throw new Error('Wallet not connected');
      if (typeof window !== 'undefined' && (window as any).freighter) {
        return (window as any).freighter.signTransaction(xdr);
      }
      throw new Error('Wallet not available');
    },
    [address],
  );

  return {
    connected: !!address,
    address,
    connect,
    disconnect,
    signTransaction,
  };
}
