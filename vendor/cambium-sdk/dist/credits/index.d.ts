/**
 * Credits module — read and write operations for the credit token.
 *
 * Maps to the `credit-token` SEP-41 contract:
 * - balanceOf(address) -> string (balance as decimal string)
 * - transfer(from, to, amount) -> Transaction (unsigned)
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import { CambiumClient } from '../client';
import { TransferParams } from '../types';
export declare class CreditsModule {
    private client;
    constructor(client: CambiumClient);
    /** Get the credit token contract address. */
    private get contractId();
    /**
     * Get the token balance for an address.
     * @param address - The Stellar address to check
     * @returns Balance as a decimal string
     */
    balanceOf(address: string): Promise<string>;
    /**
     * Build an unsigned transaction to transfer credits.
     * @param params - Transfer parameters (from, to, amount)
     * @returns Unsigned transaction ready for signing
     */
    transfer(params: TransferParams): Promise<StellarSdk.Transaction>;
    /**
     * Transfer and submit in one step (requires signer in client config).
     * @param params - Transfer parameters
     */
    transferAndSubmit(params: TransferParams): Promise<{
        status: string;
        hash?: string;
    }>;
}
//# sourceMappingURL=index.d.ts.map