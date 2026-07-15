/**
 * CambiumClient — the main entry point for the Cambium Protocol SDK.
 *
 * Holds network config and deployed contract addresses, and exposes
 * namespaced modules: registry, credits, marketplace, retirement.
 *
 * Design: unsigned by default. Write methods build and simulate a transaction
 * and return it unsigned, keeping key custody entirely out of the SDK.
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import { ContractAddresses, Network } from './types';
import { RegistryModule } from './registry';
import { CreditsModule } from './credits';
import { MarketplaceModule } from './marketplace';
import { RetirementModule } from './retirement';
import { Signer } from './signers/types';
export interface CambiumClientConfig {
    network: Network;
    rpcUrl: string;
    contracts: ContractAddresses;
    signer?: Signer;
}
export declare class CambiumClient {
    readonly network: Network;
    readonly rpcUrl: string;
    readonly contracts: ContractAddresses;
    readonly signer?: Signer;
    readonly registry: RegistryModule;
    readonly credits: CreditsModule;
    readonly marketplace: MarketplaceModule;
    readonly retirement: RetirementModule;
    private _server;
    constructor(config: CambiumClientConfig);
    /** Get the Stellar network passphrase for this client's network. */
    get networkPassphrase(): string;
    /** Get the underlying Soroban RPC server instance. */
    get server(): StellarSdk.SorobanRpc.Server;
    /** Get the current ledger sequence from the network. */
    getLedgerSequence(): Promise<number>;
    /**
     * Invoke a Soroban contract method (read-only simulation).
     * Returns the parsed result of the contract call.
     */
    invokeContract(contractId: string, method: string, args: StellarSdk.xdr.ScVal[]): Promise<unknown>;
    /**
     * Build, simulate, and return an unsigned transaction for a contract call.
     * The transaction is ready for signing and submission.
     */
    buildTransaction(contractId: string, method: string, args: StellarSdk.xdr.ScVal[], sourceAccount: string): Promise<StellarSdk.Transaction>;
    /**
     * Submit a signed transaction to the network.
     */
    submit(signedXdr: string): Promise<StellarSdk.SorobanRpc.Api.SendTransactionResponse>;
}
//# sourceMappingURL=client.d.ts.map