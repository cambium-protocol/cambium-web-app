/**
 * Marketplace module — read and write operations for AMM pools and trading.
 *
 * Maps to the `marketplace` Soroban contract:
 * - getPool(poolId) -> PoolState
 * - quote(poolId, amountIn) -> Quote (read-only price estimate)
 * - swap(params) -> Transaction (unsigned)
 * - placeLimitOrder -> stub (NotYetImplemented)
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import { CambiumClient } from '../client';
import { PoolState, Quote, SwapParams } from '../types';
export declare class MarketplaceModule {
    private client;
    constructor(client: CambiumClient);
    /** Get the marketplace contract address. */
    private get contractId();
    /**
     * Get the state of a liquidity pool.
     * @param poolId - The pool's ID (32-byte hex)
     */
    getPool(poolId: string): Promise<PoolState>;
    /**
     * Get a price quote for swapping through a pool (read-only, no tx).
     *
     * Calculates the expected output amount using the constant-product formula
     * without building a transaction. Useful for displaying estimated prices.
     *
     * @param params - The swap parameters (poolId, amountIn)
     * @returns A Quote with expected output and price impact
     */
    quote(params: {
        poolId: string;
        amountIn: string;
    }): Promise<Quote>;
    /**
     * Build an unsigned transaction to swap tokens through an AMM pool.
     * @param params - Swap parameters (poolId, amountIn, minAmountOut, trader)
     */
    swap(params: SwapParams): Promise<StellarSdk.Transaction>;
    /**
     * Place a limit order (not yet implemented — deferred per roadmap).
     */
    placeLimitOrder(): Promise<never>;
    /**
     * Cancel an order (not yet implemented — deferred per roadmap).
     */
    cancelOrder(): Promise<never>;
    /**
     * Get the order book (not yet implemented — deferred per roadmap).
     */
    getOrderBook(): Promise<never>;
    private parsePool;
}
//# sourceMappingURL=index.d.ts.map