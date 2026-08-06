'use client';

import { useMemo, useState, Suspense } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getCambiumClient } from '@/lib/cambiumClient';
import { getRetirementByTxHash } from '@/lib/chain';
import { useWallet } from '@/lib/hooks/useWallet';
import { useToast } from '@/lib/hooks/useToast';
import { formatAmount, formatDate, shortAddress } from '@/lib/format';
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
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Retire Credits</h1>
          <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
        </div>
      }
    >
      <RetireForm />
    </Suspense>
  );
}

function RetireForm() {
  const { connected, address, signTransaction } = useWallet();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const prefilledProjectId = searchParams?.get('projectId') ?? '';

  const [projectId, setProjectId] = useState(prefilledProjectId);
  const [vintageYear, setVintageYear] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmation, setConfirmation] = useState<{
    txHash: string;
    record: RetirementRecord | null;
    searching: boolean;
  } | null>(null);

  const projectQuery = useQuery<{ id: string; methodology: string } | null>({
    queryKey: ['retire-prefill', prefilledProjectId],
    queryFn: async () => {
      if (!prefilledProjectId) return null;
      const client = getCambiumClient();
      try {
        const project = await client.registry.getProject(prefilledProjectId);
        return { id: project.id, methodology: project.methodology };
      } catch {
        return null;
      }
    },
    enabled: !!prefilledProjectId,
  });

  const prefilledProject = useMemo(() => projectQuery.data, [projectQuery.data]);

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
      const txHash = result.hash;
      if (!txHash) {
        throw new Error('Transaction submitted but no hash was returned');
      }
      return txHash;
    },
    onSuccess: async (txHash: string) => {
      addToast('success', 'Retirement transaction submitted.');
      setConfirmation({ txHash, record: null, searching: true });
      setProjectId('');
      setVintageYear('');
      setAmount('');
      try {
        const record = await getRetirementByTxHash(txHash);
        setConfirmation({ txHash, record, searching: false });
      } catch {
        setConfirmation({ txHash, record: null, searching: false });
      }
    },
    onError: (err: Error) => {
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
          {prefilledProject && (
            <p className="mt-1 text-xs text-gray-500">
              Prefilled from{' '}
              <Link
                href={`/projects/${prefilledProject.id}`}
                className="text-green-600 hover:text-green-700"
              >
                {prefilledProject.methodology}
              </Link>
            </p>
          )}
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

      {retireMutation.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {retireMutation.error.message}
        </div>
      )}

      {confirmation && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">Retirement submitted.</p>
          <div className="mt-2 space-y-1 border-t border-green-200 pt-2 text-xs">
            <p>
              Transaction:{' '}
              <span className="font-mono">{shortAddress(confirmation.txHash, 12, 8)}</span>
            </p>
            {confirmation.searching && (
              <p className="text-green-600">
                Locating the on-chain retirement record…
              </p>
            )}
            {!confirmation.searching &&
              (confirmation.record ? (
                <>
                  <p>
                    Retirement ID:{' '}
                    <span className="font-mono">
                      {shortAddress(confirmation.record.id, 12, 8)}
                    </span>
                  </p>
                  <p>
                    Amount:{' '}
                    <span className="font-medium">
                      {formatAmount(confirmation.record.amount)} tCO2e
                    </span>
                  </p>
                  <p>
                    Vintage:{' '}
                    <span className="font-medium">
                      {confirmation.record.vintageYear}
                    </span>
                  </p>
                  <p>
                    Retired at:{' '}
                    <span className="font-medium">
                      {formatDate(confirmation.record.retiredAt)}
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-yellow-700">
                  The record is not visible in the scanned event range yet. It
                  will appear on the ledger once the indexer catches up.
                </p>
              ))}
          </div>
          <div className="mt-3 flex gap-3 border-t border-green-200 pt-3 text-xs">
            {confirmation.record && (
              <a
                href={`/api/certificates/${confirmation.record.id}`}
                className="font-medium text-green-700 hover:underline"
              >
                Download certificate (PDF)
              </a>
            )}
            <Link
              href="/ledger"
              className="font-medium text-green-700 hover:underline"
            >
              View retirement ledger
            </Link>
            <Link
              href="/portfolio"
              className="font-medium text-green-700 hover:underline"
            >
              View portfolio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
