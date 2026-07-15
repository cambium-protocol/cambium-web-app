"use strict";
/**
 * CambiumClient — the main entry point for the Cambium Protocol SDK.
 *
 * Holds network config and deployed contract addresses, and exposes
 * namespaced modules: registry, credits, marketplace, retirement.
 *
 * Design: unsigned by default. Write methods build and simulate a transaction
 * and return it unsigned, keeping key custody entirely out of the SDK.
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
exports.CambiumClient = void 0;
const StellarSdk = __importStar(require("@stellar/stellar-sdk"));
const registry_1 = require("./registry");
const credits_1 = require("./credits");
const marketplace_1 = require("./marketplace");
const retirement_1 = require("./retirement");
const errors_1 = require("./errors");
const NETWORK_PASSPHRASES = {
    testnet: 'Test SDF Network ; September 2015',
    mainnet: 'Public Global Stellar Network ; September 2015',
    futurenet: 'Test SDF Future Network ; October 2022',
    local: 'Standalone Network ; February 2017',
};
class CambiumClient {
    constructor(config) {
        if (!config.rpcUrl) {
            throw new errors_1.ConfigError('rpcUrl is required');
        }
        if (!config.contracts?.registry) {
            throw new errors_1.ConfigError('registry contract address is required');
        }
        if (!config.contracts?.creditToken) {
            throw new errors_1.ConfigError('creditToken contract address is required');
        }
        if (!config.contracts?.marketplace) {
            throw new errors_1.ConfigError('marketplace contract address is required');
        }
        this.network = config.network;
        this.rpcUrl = config.rpcUrl;
        this.contracts = config.contracts;
        this.signer = config.signer;
        this._server = new StellarSdk.SorobanRpc.Server(config.rpcUrl);
        // Initialize modules
        this.registry = new registry_1.RegistryModule(this);
        this.credits = new credits_1.CreditsModule(this);
        this.marketplace = new marketplace_1.MarketplaceModule(this);
        this.retirement = new retirement_1.RetirementModule(this);
    }
    /** Get the Stellar network passphrase for this client's network. */
    get networkPassphrase() {
        return NETWORK_PASSPHRASES[this.network];
    }
    /** Get the underlying Soroban RPC server instance. */
    get server() {
        return this._server;
    }
    /** Get the current ledger sequence from the network. */
    async getLedgerSequence() {
        const response = await this._server.getLatestLedger();
        return response.sequence;
    }
    /**
     * Invoke a Soroban contract method (read-only simulation).
     * Returns the parsed result of the contract call.
     */
    async invokeContract(contractId, method, args) {
        const contract = new StellarSdk.Contract(contractId);
        const operation = contract.call(method, ...args);
        // Build a dummy transaction for simulation
        const dummyKeypair = StellarSdk.Keypair.random();
        const dummyAccount = new StellarSdk.Account(dummyKeypair.publicKey(), '0');
        const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
            networkPassphrase: this.networkPassphrase,
            fee: '0',
        })
            .addOperation(operation)
            .setTimeout(StellarSdk.TimeoutInfinite)
            .build();
        const simulation = await this._server.simulateTransaction(transaction);
        if (StellarSdk.SorobanRpc.Api.isSimulationError(simulation)) {
            throw new Error(`Simulation failed: ${simulation.error}`);
        }
        return simulation.result?.retval;
    }
    /**
     * Build, simulate, and return an unsigned transaction for a contract call.
     * The transaction is ready for signing and submission.
     */
    async buildTransaction(contractId, method, args, sourceAccount) {
        const contract = new StellarSdk.Contract(contractId);
        const account = await this._server.getAccount(sourceAccount);
        const transaction = new StellarSdk.TransactionBuilder(account, {
            networkPassphrase: this.networkPassphrase,
            fee: '100000',
        })
            .addOperation(contract.call(method, ...args))
            .setTimeout(StellarSdk.TimeoutInfinite)
            .build();
        // Simulate to get resource estimates
        const simulation = await this._server.simulateTransaction(transaction);
        if (StellarSdk.SorobanRpc.Api.isSimulationError(simulation)) {
            throw new Error(`Simulation failed: ${simulation.error}`);
        }
        // Restore with simulated resources
        return StellarSdk.TransactionBuilder.cloneFrom(transaction, {
            fee: StellarSdk.BASE_FEE,
        }).build();
    }
    /**
     * Submit a signed transaction to the network.
     */
    async submit(signedXdr) {
        const transaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);
        return this._server.sendTransaction(transaction);
    }
}
exports.CambiumClient = CambiumClient;
//# sourceMappingURL=client.js.map