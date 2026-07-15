"use strict";
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
exports.RetirementModule = void 0;
const StellarSdk = __importStar(require("@stellar/stellar-sdk"));
const errors_1 = require("../errors");
class RetirementModule {
    constructor(client) {
        this.client = client;
    }
    /** Get the retirement contract address. */
    get contractId() {
        return this.client.contracts.retirement;
    }
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
    async retire(params) {
        if (params.shield) {
            throw new errors_1.NotYetImplementedError('shielded retirement (shield: true) — contract does not yet support this path');
        }
        const args = [
            new StellarSdk.Address(params.from).toScVal(),
            new StellarSdk.Address(params.projectId).toScVal(),
            StellarSdk.nativeToScVal(params.vintageYear, { type: 'u32' }),
            StellarSdk.nativeToScVal(params.amount, { type: 'i128' }),
            StellarSdk.nativeToScVal(false, { type: 'bool' }),
        ];
        return this.client.buildTransaction(this.contractId, 'retire', args, params.from);
    }
    /**
     * Retrieve a retirement record by its on-chain ID.
     * @param id - The 32-byte hex retirement record ID
     */
    async getRetirement(id) {
        const result = await this.client.invokeContract(this.contractId, 'get_retirement', [new StellarSdk.Address(id).toScVal()]);
        return this.parseRecord(result);
    }
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
    async listRetirements(filter) {
        // Soroban storage doesn't support iteration — in production this would
        // use an event index or off-chain indexer. For now, return empty.
        // TODO: implement via event indexing or off-chain indexer
        return [];
    }
    // -- Parsers --
    parseRecord(value) {
        const obj = value;
        const retireeRaw = obj.retiree;
        let retiree;
        if (retireeRaw && 'Public' in retireeRaw) {
            retiree = {
                type: 'public',
                address: String(retireeRaw.Public._0 || ''),
            };
        }
        else if (retireeRaw && 'Shielded' in retireeRaw) {
            retiree = {
                type: 'shielded',
                nullifierHash: String(retireeRaw.Shielded._0 || ''),
            };
        }
        else {
            retiree = { type: 'public', address: '' };
        }
        return {
            id: String(obj.id || ''),
            projectId: String(obj.project_id || ''),
            vintageYear: Number(obj.vintage_year || 0),
            amount: String(obj.amount || '0'),
            retiredAt: Number(obj.retired_at || 0),
            retiree,
        };
    }
}
exports.RetirementModule = RetirementModule;
//# sourceMappingURL=index.js.map