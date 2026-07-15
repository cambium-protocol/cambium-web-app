'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getCambiumClient } from '@/lib/cambiumClient';
import { useWallet } from '@/lib/hooks/useWallet';
import { useToast } from '@/lib/hooks/useToast';
import type { RetirementRecord } from '@cambium-protocol/sdk';

function isValidYear(value: string): boolean {
  if (!value) return false;
  const num = Number(value);
  const currentYear = new Date().getFullYear();
  return Number.isInteger(num) && num >= 2000 && num <= currentYear + 1;
}

function isValidAmount(value: string): boolean {
  if (!value) return false;
  const num = Number(value);
  return !isNaN(num) && num > 0 && /^\d*\.?\d*$/.test(value);
}

export default function RetirePage() {
  const { connected, address, signTransaction } = useWallet();
  const { addToast } = useToast();
  const [projectId, setProjectId] = useState('');
  const [vintageYear, setVintageYear] = useState('');
  const [amount, setAmount] = useState('');
  const [retireResult, setRetireResult] = useState<{
    success: boolean;
    record?: RetirementRecord;
    message: string;
  } | null>(null);

  const projectIdValid = projectId.length > 0;
  const vintageYearValid = isValidYear(vintageYear);
  const amountValid = isValidAmount(amount);
  const formValid = projectIdValid && vintageYearValid && amountValid;

  const retireMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Wallet not connected');
      const client = getCambiumClient();
      const tx = await client.retirement.retire({
        from: address,
        projectId,
        vintageYear: parseInt(vintageYear, 10),
        amount,
        shield: false,
      });
      const signedXdr = await signTransaction(tx.toXDR());
      const result = await client.submit(signedXdr);
      return result;
    },
    onSuccess: (data: any) => {
      const record = data?.record || data?.retirementRecord;
      setRetireResult({
        success: true,
        record,
        message: 'Credits retired successfully.',
      });
      addToast('success', 'Credits retired successfully.');
      setProjectId('');
      setVintageYear('');
      setAmount('');
    },
    onError: (err: Error) => {
      setRetireResult({ success: false, message: err.message });
      addToast('error', err.message);
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Retire Credits</h1>

      <div className="space-y-4 rounded-lg border border-gray-200 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Project ID
          </label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {projectId.length > 0 && !projectIdValid && (
            <p className="mt-1 text-xs text-red-600">Project ID is required</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Vintage Year
          </label>
          <input
            type="text"
            value={vintageYear}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*$/.test(val)) {
                setVintageYear(val);
              }
            }}
            placeholder="2025"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {vintageYear.length > 0 && !vintageYearValid && (
            <p className="mt-1 text-xs text-red-600">
              Enter a valid year (2000-{new Date().getFullYear() + 1})
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Amount (tCO2e)
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setAmount(val);
              }
            }}
            placeholder="0"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          {amount.length > 0 && !amountValid && (
            <p className="mt-1 text-xs text-red-600">
              Enter a valid positive amount
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
          <input type="checkbox" disabled className="cursor-not-allowed" />
          <span>Make this retirement private (shielded) — Coming Soon</span>
        </div>

        <button
          onClick={() => retireMutation.mutate()}
          disabled={!connected || !formValid || retireMutation.isPending}
          className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!connected
            ? 'Connect Wallet First'
            : retireMutation.isPending
              ? 'Retiring...'
              : 'Retire'}
        </button>
      </div>

      {retireResult && retireResult.success && retireResult.record && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <p className="font-medium">{retireResult.message}</p>
          <div className="mt-2 border-t border-green-200 pt-2 text-xs">
            <p>Retirement ID: {retireResult.record.id}</p>
            <p>Amount: {retireResult.record.amount} tCO2e</p>
            <p>Year: {retireResult.record.vintageYear}</p>
          </div>
        </div>
      )}
    </div>
  );
}
