"use strict";
/**
 * Registry module — read and write operations for carbon projects and vintages.
 *
 * Maps to the `registry` Soroban contract:
 * - getProject(projectId) -> Project
 * - getVintage(projectId, year) -> Vintage
 * - registerProject(project) -> Transaction (unsigned)
 * - requestMint(projectId, vintageYear, amount, proof) -> Transaction (unsigned)
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
exports.RegistryModule = void 0;
const StellarSdk = __importStar(require("@stellar/stellar-sdk"));
class RegistryModule {
    constructor(client) {
        this.client = client;
    }
    /** Get the registry contract address. */
    get contractId() {
        return this.client.contracts.registry;
    }
    /**
     * Look up a registered project by ID.
     * @param projectId - The 32-byte hex project ID
     */
    async getProject(projectId) {
        const result = await this.client.invokeContract(this.contractId, 'get_project', [new StellarSdk.Address(projectId).toScVal()]);
        return this.parseProject(result);
    }
    /**
     * Look up a vintage record by project ID and year.
     * @param projectId - The 32-byte hex project ID
     * @param year - The vintage year (e.g. 2025)
     */
    async getVintage(projectId, year) {
        const result = await this.client.invokeContract(this.contractId, 'get_vintage', [
            new StellarSdk.Address(projectId).toScVal(),
            StellarSdk.nativeToScVal(year, { type: 'u32' }),
        ]);
        return this.parseVintage(result);
    }
    /**
     * List projects (read-only).
     * Note: Soroban contracts don't have native list support — this is a
     * convenience method that may need off-chain indexing in production.
     * For now, returns a single project if found.
     */
    async listProjects(_filter) {
        // Soroban storage doesn't support iteration — in production this would
        // use an event index or off-chain indexer. For now, return empty.
        // TODO: implement via event indexing or off-chain indexer
        return [];
    }
    /**
     * Build an unsigned transaction to register a new project.
     * @param project - The project to register
     * @param sourceAccount - The account that will sign the transaction
     */
    async registerProject(project, sourceAccount) {
        const args = [
            StellarSdk.nativeToScVal({
                id: new StellarSdk.Address(project.id),
                methodology: StellarSdk.nativeToScVal(project.methodology, {
                    type: 'symbol',
                }),
                geography: StellarSdk.nativeToScVal(project.geography, {
                    type: 'symbol',
                }),
                external_registry_ref: project.externalRegistryRef
                    ? StellarSdk.nativeToScVal(Buffer.from(project.externalRegistryRef), { type: 'bytes' })
                    : StellarSdk.nativeToScVal(null, { type: 'option' }),
                verifying_key_version: StellarSdk.nativeToScVal(project.verifyingKeyVersion, { type: 'u32' }),
            }, { type: 'contract' }),
        ];
        return this.client.buildTransaction(this.contractId, 'register_project', args, sourceAccount);
    }
    /**
     * Build an unsigned transaction to request a mint.
     * @param projectId - The project ID
     * @param vintageYear - The vintage year
     * @param amount - Amount to mint (as string to avoid precision loss)
     * @param proof - The ZK proof data
     * @param sourceAccount - The account that will sign the transaction
     */
    async requestMint(projectId, vintageYear, amount, proof, sourceAccount) {
        const args = [
            new StellarSdk.Address(projectId).toScVal(),
            StellarSdk.nativeToScVal(vintageYear, { type: 'u32' }),
            StellarSdk.nativeToScVal(amount, { type: 'i128' }),
            StellarSdk.nativeToScVal({
                proof_data: StellarSdk.nativeToScVal(Buffer.from(proof.proofData, 'hex'), { type: 'bytes' }),
                public_inputs: StellarSdk.nativeToScVal(proof.publicInputs.map((pi) => new StellarSdk.Address(pi).toScVal()), { type: 'vec' }),
            }, { type: 'contract' }),
        ];
        return this.client.buildTransaction(this.contractId, 'request_mint', args, sourceAccount);
    }
    // -- Parsers --
    parseProject(value) {
        // Placeholder parser — will be refined against actual XDR response shape
        const obj = value;
        return {
            id: String(obj.id || ''),
            methodology: String(obj.methodology || ''),
            geography: String(obj.geography || ''),
            externalRegistryRef: obj.external_registry_ref
                ? String(obj.external_registry_ref)
                : undefined,
            verifyingKeyVersion: Number(obj.verifying_key_version || 0),
        };
    }
    parseVintage(value) {
        const obj = value;
        return {
            projectId: String(obj.project_id || ''),
            year: Number(obj.year || 0),
            totalIssued: String(obj.total_issued || '0'),
            totalRetired: String(obj.total_retired || '0'),
        };
    }
}
exports.RegistryModule = RegistryModule;
//# sourceMappingURL=index.js.map