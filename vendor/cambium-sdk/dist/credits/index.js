"use strict";
/**
 * Credits module — read and write operations for the credit token.
 *
 * Maps to the `credit-token` SEP-41 contract:
 * - balanceOf(address) -> string (balance as decimal string)
 * - transfer(from, to, amount) -> Transaction (unsigned)
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
exports.CreditsModule = void 0;
const StellarSdk = __importStar(require("@stellar/stellar-sdk"));
class CreditsModule {
    constructor(client) {
        this.client = client;
    }
    /** Get the credit token contract address. */
    get contractId() {
        return this.client.contracts.creditToken;
    }
    /**
     * Get the token balance for an address.
     * @param address - The Stellar address to check
     * @returns Balance as a decimal string
     */
    async balanceOf(address) {
        const result = await this.client.invokeContract(this.contractId, 'balance', [new StellarSdk.Address(address).toScVal()]);
        return String(result);
    }
    /**
     * Build an unsigned transaction to transfer credits.
     * @param params - Transfer parameters (from, to, amount)
     * @returns Unsigned transaction ready for signing
     */
    async transfer(params) {
        const args = [
            new StellarSdk.Address(params.from).toScVal(),
            new StellarSdk.Address(params.to).toScVal(),
            StellarSdk.nativeToScVal(params.amount, { type: 'i128' }),
        ];
        return this.client.buildTransaction(this.contractId, 'transfer', args, params.from);
    }
    /**
     * Transfer and submit in one step (requires signer in client config).
     * @param params - Transfer parameters
     */
    async transferAndSubmit(params) {
        const tx = await this.transfer(params);
        if (!this.client.signer) {
            throw new Error('transferAndSubmit requires a signer in the client config');
        }
        const signedXdr = await this.client.signer.signTransaction(tx.toXDR());
        const result = await this.client.submit(signedXdr);
        return {
            status: result.status,
            hash: result.hash,
        };
    }
}
exports.CreditsModule = CreditsModule;
//# sourceMappingURL=index.js.map