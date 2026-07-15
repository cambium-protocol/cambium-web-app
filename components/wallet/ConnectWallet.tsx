'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';

export function ConnectWallet() {
  const { connected, address, loading, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = async () => {
    setError(null);
    try {
      await connect();
    } catch (e: any) {
      setError(e.message || 'Failed to connect');
    }
  };

  if (loading) {
    return (
      <div className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-400">
        Loading wallet...
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Connect Wallet
        </button>
        {error && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 shadow-lg">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
