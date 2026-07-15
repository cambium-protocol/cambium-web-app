"use strict";
/**
 * Typed error hierarchy for the Cambium SDK.
 *
 * All SDK methods throw a CambiumError subclass on failure,
 * mapping to on-chain error codes from contracts/shared/src/lib.rs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigError = exports.NotYetImplementedError = exports.PoolNotFoundError = exports.InsufficientBalanceError = exports.AlreadyRegisteredError = exports.InvalidProofError = exports.NotFoundError = exports.ContractError = exports.CambiumError = void 0;
/** Base error for all Cambium SDK errors. */
class CambiumError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CambiumError';
    }
}
exports.CambiumError = CambiumError;
/** Error thrown when a contract call fails. */
class ContractError extends CambiumError {
    constructor(code, message) {
        super(message);
        this.name = 'ContractError';
        this.code = code;
    }
}
exports.ContractError = ContractError;
/** The requested entity was not found. */
class NotFoundError extends ContractError {
    constructor(entity, id) {
        super(2, `${entity} not found: ${id}`);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/** The proof provided is invalid or malformed. */
class InvalidProofError extends ContractError {
    constructor(message = 'Invalid proof') {
        super(4, message);
        this.name = 'InvalidProofError';
    }
}
exports.InvalidProofError = InvalidProofError;
/** The project has already been registered. */
class AlreadyRegisteredError extends ContractError {
    constructor(id) {
        super(5, `Project already registered: ${id}`);
        this.name = 'AlreadyRegisteredError';
    }
}
exports.AlreadyRegisteredError = AlreadyRegisteredError;
/** Insufficient token balance. */
class InsufficientBalanceError extends ContractError {
    constructor(message = 'Insufficient balance') {
        super(8, message);
        this.name = 'InsufficientBalanceError';
    }
}
exports.InsufficientBalanceError = InsufficientBalanceError;
/** Pool not found. */
class PoolNotFoundError extends ContractError {
    constructor(poolId) {
        super(9, `Pool not found: ${poolId}`);
        this.name = 'PoolNotFoundError';
    }
}
exports.PoolNotFoundError = PoolNotFoundError;
/** Feature not yet implemented. */
class NotYetImplementedError extends ContractError {
    constructor(feature) {
        super(7, `Not yet implemented: ${feature}`);
        this.name = 'NotYetImplementedError';
    }
}
exports.NotYetImplementedError = NotYetImplementedError;
/** Configuration error. */
class ConfigError extends CambiumError {
    constructor(message) {
        super(message);
        this.name = 'ConfigError';
    }
}
exports.ConfigError = ConfigError;
//# sourceMappingURL=errors.js.map