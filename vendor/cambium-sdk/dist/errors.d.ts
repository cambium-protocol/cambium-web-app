/**
 * Typed error hierarchy for the Cambium SDK.
 *
 * All SDK methods throw a CambiumError subclass on failure,
 * mapping to on-chain error codes from contracts/shared/src/lib.rs.
 */
/** Base error for all Cambium SDK errors. */
export declare class CambiumError extends Error {
    constructor(message: string);
}
/** Error thrown when a contract call fails. */
export declare class ContractError extends CambiumError {
    code: number;
    constructor(code: number, message: string);
}
/** The requested entity was not found. */
export declare class NotFoundError extends ContractError {
    constructor(entity: string, id: string);
}
/** The proof provided is invalid or malformed. */
export declare class InvalidProofError extends ContractError {
    constructor(message?: string);
}
/** The project has already been registered. */
export declare class AlreadyRegisteredError extends ContractError {
    constructor(id: string);
}
/** Insufficient token balance. */
export declare class InsufficientBalanceError extends ContractError {
    constructor(message?: string);
}
/** Pool not found. */
export declare class PoolNotFoundError extends ContractError {
    constructor(poolId: string);
}
/** Feature not yet implemented. */
export declare class NotYetImplementedError extends ContractError {
    constructor(feature: string);
}
/** Configuration error. */
export declare class ConfigError extends CambiumError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map