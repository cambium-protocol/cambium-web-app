"use strict";
/**
 * Marketplace module — read and write operations for AMM pools and trading.
 *
 * Maps to the `marketplace` Soroban contract:
 * - getPool(poolId) -> PoolState
 * - quote(poolId, amountIn) -> Quote (read-only price estimate)
 * - swap(params) -> Transaction (unsigned)
 * - placeLimitOrder -> stub (NotYetImplemented)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceModule = void 0;
const StellarSdk = __importStar(require("@stellar/stellar-sdk"));
const errors_1 = require("../errors");
class MarketplaceModule {
    constructor(client) {
        this.client = client;
    }
    /** Get the marketplace contract address. */
    get contractId() {
        return this.client.contracts.marketplace;
    }
    /**
     * Get the state of a liquidity pool.
     * @param poolId - The pool's ID (32-byte hex)
     */
    async getPool(poolId) {
        const result = await this.client.invokeContract(this.contractId, 'get_pool', [new StellarSdk.Address(poolId).toScVal()]);
        return this.parsePool(result);
    }
    /**
     * Get a price quote for swapping through a pool (read-only, no tx).
     *
     * Calculates the expected output amount using the constant-product formula
     * without building a transaction. Useful for displaying estimated prices.
     *
     * @param params - The swap parameters (poolId, amountIn)
     * @returns A Quote with expected output and price impact
     */
    async quote(params) {
        const pool = await this.getPool(params.poolId);
        const creditReserves = BigInt(pool.creditReserves);
        const pairedReserves = BigInt(pool.pairedReserves);
        const amountIn = BigInt(params.amountIn);
        // Constant-product AMM: dy = (y * dx) / (x + dx)
        const amountOut = (pairedReserves * amountIn) / (creditReserves + amountIn);
        // Price impact = (amountOut / amountIn) / (pairedReserves / creditReserves) - 1
        const spotPrice = pairedReserves * 10000n / creditReserves;
        const executionPrice = amountOut * 10000n / amountIn;
        const priceImpact = ((executionPrice - spotPrice) * 10000n) / spotPrice;
        return {
            poolId: params.poolId,
            amountIn: params.amountIn,
            amountOut: amountOut.toString(),
            priceImpact: `${Number(priceImpact) / 100}%`,
        };
    }
    /**
     * Build an unsigned transaction to swap tokens through an AMM pool.
     * @param params - Swap parameters (poolId, amountIn, minAmountOut, trader)
     */
    async swap(params) {
        const args = [
            new StellarSdk.Address(params.poolId).toScVal(),
            StellarSdk.nativeToScVal(params.amountIn, { type: 'i128' }),
            StellarSdk.nativeToScVal(params.minAmountOut, { type: 'i128' }),
        ];
        return this.client.buildTransaction(this.contractId, 'swap', args, params.trader);
    }
    /**
     * Place a limit order (not yet implemented — deferred per roadmap).
     */
    async placeLimitOrder() {
        throw new errors_1.NotYetImplementedError('limit order book (place_limit_order)');
    }
    /**
     * Cancel an order (not yet implemented — deferred per roadmap).
     */
    async cancelOrder() {
        throw new errors_1.NotYetImplementedError('cancel order');
    }
    /**
     * Get the order book (not yet implemented — deferred per roadmap).
     */
    async getOrderBook() {
        throw new errors_1.NotYetImplementedError('order book');
    }
    // -- Parser --
    parsePool(value) {
        const obj = value;
        return {
            id: String(obj.id || ''),
            creditToken: String(obj.credit_token || ''),
            pairedAsset: String(obj.paired_asset || ''),
            creditReserves: String(obj.credit_reserves || '0'),
            pairedReserves: String(obj.paired_reserves || '0'),
        };
    }
}
exports.MarketplaceModule = MarketplaceModule;
//# sourceMappingURL=index.js.map