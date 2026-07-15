/**
 * Retirement module — read and write operations for credit retirement.
 *
 * Maps to the `retirement` Soroban contract:
 * - retire(params) -> Transaction (unsigned)
 * - getRetirement(id) -> RetirementRecord
 * - listRetirements(filter?) -> RetirementRecord[]
 *
 * Shielded retirement (shield: true) is not yet supported by the contract.
 * The SDK surfaces a clear typed error rather than silently succeeding.
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import { CambiumClient } from '../client';
import { RetireParams, RetirementRecord, RetirementFilter } from '../types';
export declare class RetirementModule {
    private client;
    constructor(client: CambiumClient);
    /** Get the retirement contract address. */
    private get contractId();
    /**
     * Build an unsigned transaction to retire carbon credits.
     *
     * @param params - Retirement parameters (from, projectId, vintageYear, amount, shield?)
     * @returns An unsigned transaction ready for signing and submission.
     *
     * When `shield: true`, throws NotYetImplementedError because the underlying
     * contract does not yet support shielded retirement. This is never a silent
     * success — the contract would also reject it, and we surface that early.
     */
    retire(params: RetireParams): Promise<StellarSdk.Transaction>;
    /**
     * Retrieve a retirement record by its on-chain ID.
     * @param id - The 32-byte hex retirement record ID
     */
    getRetirement(id: string): Promise<RetirementRecord>;
    /**
     * List retirement records matching an optional filter.
     *
     * Note: Soroban contracts don't support iteration over storage — this method
     * currently returns records that can be looked up. In production this would
     * use an event indexer or off-chain indexer. For now, returns at most one
     * record if a specific projectId is provided (used as a known ID lookup).
     *
     * @param filter - Optional filter criteria
     */
    listRetirements(filter?: RetirementFilter): Promise<RetirementRecord[]>;
    private parseRecord;
}
//# sourceMappingURL=index.d.ts.map