"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccountingLedgerTransactionSchema = exports.updateAccountingLedgerTransactionSchema = exports.createAccountingLedgerTransactionSchema = exports.getAccountingLedgerTransactionsSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const optionalText = (max = 255) => zod_1.z.string().trim().max(max).optional().or(zod_1.z.literal(''));
const dateStringSchema = zod_1.z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'transactionDate must be a valid date',
});
const moneySchema = zod_1.z.coerce.number().min(0).max(999999999);
exports.getAccountingLedgerTransactionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
            message: 'page must be a positive integer',
        }),
        limit: zod_1.z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
            message: 'limit must be a positive integer',
        }),
        search: optionalText(100),
        type: zod_1.z.enum(enums_1.AccountingLedgerTransactionType).optional(),
        status: zod_1.z.enum(enums_1.AccountingLedgerTransactionStatus).optional(),
        account: optionalText(150),
    }),
});
exports.createAccountingLedgerTransactionSchema = zod_1.z
    .object({
    body: zod_1.z.object({
        transactionDate: dateStringSchema,
        type: zod_1.z.enum(enums_1.AccountingLedgerTransactionType),
        party: zod_1.z.string().trim().min(1).max(150),
        note: optionalText(500),
        account: zod_1.z.string().trim().min(1).max(150),
        accountNo: optionalText(80),
        category: zod_1.z.string().trim().min(1).max(100),
        debit: moneySchema.optional(),
        credit: moneySchema.optional(),
        status: zod_1.z.enum(enums_1.AccountingLedgerTransactionStatus),
        reference: optionalText(100),
    }),
})
    .refine((data) => { var _a, _b; return Number((_a = data.body.debit) !== null && _a !== void 0 ? _a : 0) > 0 || Number((_b = data.body.credit) !== null && _b !== void 0 ? _b : 0) > 0; }, {
    message: 'debit or credit is required',
    path: ['body', 'debit'],
});
exports.updateAccountingLedgerTransactionSchema = exports.createAccountingLedgerTransactionSchema.extend({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
    }),
});
exports.deleteAccountingLedgerTransactionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
    }),
});
