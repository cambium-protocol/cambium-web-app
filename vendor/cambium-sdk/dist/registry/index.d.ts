/**
 * Registry module — read and write operations for carbon projects and vintages.
 *
 * Maps to the `registry` Soroban contract:
 * - getProject(projectId) -> Project
 * - getVintage(projectId, year) -> Vintage
 * - registerProject(project) -> Transaction (unsigned)
 * - requestMint(projectId, vintageYear, amount, proof) -> Transaction (unsigned)
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import { CambiumClient } from '../client';
import { Project, Vintage, ProjectFilter } from '../types';
export declare class RegistryModule {
    private client;
    constructor(client: CambiumClient);
    /** Get the registry contract address. */
    private get contractId();
    /**
     * Look up a registered project by ID.
     * @param projectId - The 32-byte hex project ID
     */
    getProject(projectId: string): Promise<Project>;
    /**
     * Look up a vintage record by project ID and year.
     * @param projectId - The 32-byte hex project ID
     * @param year - The vintage year (e.g. 2025)
     */
    getVintage(projectId: string, year: number): Promise<Vintage>;
    /**
     * List projects (read-only).
     * Note: Soroban contracts don't have native list support — this is a
     * convenience method that may need off-chain indexing in production.
     * For now, returns a single project if found.
     */
    listProjects(_filter?: ProjectFilter): Promise<Project[]>;
    /**
     * Build an unsigned transaction to register a new project.
     * @param project - The project to register
     * @param sourceAccount - The account that will sign the transaction
     */
    registerProject(project: Project, sourceAccount: string): Promise<StellarSdk.Transaction>;
    /**
     * Build an unsigned transaction to request a mint.
     * @param projectId - The project ID
     * @param vintageYear - The vintage year
     * @param amount - Amount to mint (as string to avoid precision loss)
     * @param proof - The ZK proof data
     * @param sourceAccount - The account that will sign the transaction
     */
    requestMint(projectId: string, vintageYear: number, amount: string, proof: {
        proofData: string;
        publicInputs: string[];
    }, sourceAccount: string): Promise<StellarSdk.Transaction>;
    private parseProject;
    private parseVintage;
}
//# sourceMappingURL=index.d.ts.map