"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sanitation_1 = require("@/common/sanitation");
const accounting_ledger_controller_1 = require("@/controllers/v1/accounting-ledger/accounting-ledger.controller");
const enums_1 = require("@/generated/prisma/enums");
const authentication_1 = require("@/middlewares/authentication");
const authorization_1 = __importDefault(require("@/middlewares/authorization"));
const express_rate_limiter_1 = require("@/middlewares/express-rate-limiter");
const accounting_ledger_1 = require("@/validators/accounting-ledger");
const router = (0, express_1.Router)();
router.get('/', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(accounting_ledger_1.getAccountingLedgerTransactionsSchema), accounting_ledger_controller_1.getAccountingLedgerTransactions);
router.post('/', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(accounting_ledger_1.createAccountingLedgerTransactionSchema), accounting_ledger_controller_1.createAccountingLedgerTransaction);
router.put('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(accounting_ledger_1.updateAccountingLedgerTransactionSchema), accounting_ledger_controller_1.updateAccountingLedgerTransaction);
router.delete('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(accounting_ledger_1.deleteAccountingLedgerTransactionSchema), accounting_ledger_controller_1.deleteAccountingLedgerTransaction);
exports.default = router;
