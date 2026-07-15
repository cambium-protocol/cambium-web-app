"use strict";
/**
 * Cambium Protocol SDK — public API exports.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigError = exports.NotYetImplementedError = exports.PoolNotFoundError = exports.InsufficientBalanceError = exports.AlreadyRegisteredError = exports.InvalidProofError = exports.NotFoundError = exports.ContractError = exports.CambiumError = exports.RetirementModule = exports.MarketplaceModule = exports.CreditsModule = exports.RegistryModule = exports.CambiumClient = void 0;
// Client
var client_1 = require("./client");
Object.defineProperty(exports, "CambiumClient", { enumerable: true, get: function () { return client_1.CambiumClient; } });
// Modules (re-exported for direct access)
var registry_1 = require("./registry");
Object.defineProperty(exports, "RegistryModule", { enumerable: true, get: function () { return registry_1.RegistryModule; } });
var credits_1 = require("./credits");
Object.defineProperty(exports, "CreditsModule", { enumerable: true, get: function () { return credits_1.CreditsModule; } });
var marketplace_1 = require("./marketplace");
Object.defineProperty(exports, "MarketplaceModule", { enumerable: true, get: function () { return marketplace_1.MarketplaceModule; } });
var retirement_1 = require("./retirement");
Object.defineProperty(exports, "RetirementModule", { enumerable: true, get: function () { return retirement_1.RetirementModule; } });
// Errors
var errors_1 = require("./errors");
Object.defineProperty(exports, "CambiumError", { enumerable: true, get: function () { return errors_1.CambiumError; } });
Object.defineProperty(exports, "ContractError", { enumerable: true, get: function () { return errors_1.ContractError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return errors_1.NotFoundError; } });
Object.defineProperty(exports, "InvalidProofError", { enumerable: true, get: function () { return errors_1.InvalidProofError; } });
Object.defineProperty(exports, "AlreadyRegisteredError", { enumerable: true, get: function () { return errors_1.AlreadyRegisteredError; } });
Object.defineProperty(exports, "InsufficientBalanceError", { enumerable: true, get: function () { return errors_1.InsufficientBalanceError; } });
Object.defineProperty(exports, "PoolNotFoundError", { enumerable: true, get: function () { return errors_1.PoolNotFoundError; } });
Object.defineProperty(exports, "NotYetImplementedError", { enumerable: true, get: function () { return errors_1.NotYetImplementedError; } });
Object.defineProperty(exports, "ConfigError", { enumerable: true, get: function () { return errors_1.ConfigError; } });
//# sourceMappingURL=index.js.map