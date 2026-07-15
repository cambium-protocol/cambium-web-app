'use client';
import { useState, useCallback, useEffect } from 'react';

interface WalletState {
  connected: boolean;
  address: string | null;
  loading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

const STORAGE_KEY = 'cambium_wallet_address';

function getFreighter(): any | null {
  if (typeof window !== 'undefined' && (window as any).freighter) {
    return (window as any).freighter;
  }
  return null;
}

function getStoredAddress(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

function setStoredAddress(address: string | null) {
  if (typeof window === 'undefined') return;
  if (address) {
    localStorage.setItem(STORAGE_KEY, address);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const freighter = getFreighter();
    if (!freighter) {
      setLoading(false);
      return;
    }

    freighter
      .isConnected()
      .then((connected: boolean) => {
        if (connected) {
          return freighter.getAddress();
        }
        const stored = getStoredAddress();
        if (stored) {
          return freighter.getAddress();
        }
        return null;
      })
      .then((addr: string | null) => {
        if (addr) {
          setAddress(addr);
          setStoredAddress(addr);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const connect = useCallback(async () => {
    const freighter = getFreighter();
    if (!freighter) {
      throw new Error('Freighter wallet not detected');
    }
    const addr = await freighter.getAddress();
    setAddress(addr);
    setStoredAddress(addr);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setStoredAddress(null);
  }, []);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!address) throw new Error('Wallet not connected');
      const freighter = getFreighter();
      if (!freighter) throw new Error('Wallet not available');
      return freighter.signTransaction(xdr);
    },
    [address],
  );

  return {
    connected: !!address,
    address,
    loading,
    connect,
    disconnect,
    signTransaction,
  };
}
