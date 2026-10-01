"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAccountingReceivablePaymentSchema = exports.updateAccountingReceivableStatusSchema = exports.deleteAccountingReceivableSchema = exports.updateAccountingReceivableSchema = exports.createAccountingReceivableSchema = exports.getAccountingReceivableByIdSchema = exports.getAccountingReceivablesSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("@/generated/prisma/enums");
const optionalText = (max = 255) => zod_1.z.string().trim().max(max).optional().or(zod_1.z.literal(''));
const dateStringSchema = zod_1.z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'date must be a valid date',
});
const moneySchema = zod_1.z.coerce.number().min(0).max(999999999);
const receivableItemSchema = zod_1.z.object({
    description: zod_1.z.string().trim().min(1).max(255),
    account: optionalText(100),
    quantity: zod_1.z.coerce.number().positive().max(999999),
    unitPrice: moneySchema,
});
const receivableBodySchema = zod_1.z.object({
    customer: zod_1.z.string().trim().min(1).max(150),
    invoiceDate: dateStringSchema,
    dueDate: dateStringSchema,
    reference: optionalText(100),
    description: optionalText(500),
    paymentTerms: optionalText(80),
    paymentMethod: optionalText(80),
    bankAccount: optionalText(150),
    notes: optionalText(500),
    discount: moneySchema.optional(),
    tax: moneySchema.optional(),
    paidAmount: moneySchema.optional(),
    status: zod_1.z.enum(enums_1.AccountingReceivableStatus).optional(),
    attachments: zod_1.z
        .array(zod_1.z.object({ name: zod_1.z.string().trim().min(1).max(255), size: optionalText(50), url: optionalText(500) }))
        .max(20)
        .optional(),
    items: zod_1.z.array(receivableItemSchema).min(1).max(100),
});
exports.getAccountingReceivablesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
            message: 'page must be a positive integer',
        }),
        limit: zod_1.z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
            message: 'limit must be a positive integer',
        }),
        search: optionalText(100),
        status: zod_1.z.enum(enums_1.AccountingReceivableStatus).optional(),
        customer: optionalText(150),
    }),
});
exports.getAccountingReceivableByIdSchema = zod_1.z.object({ params: zod_1.z.object({ id: zod_1.z.uuid() }) });
exports.createAccountingReceivableSchema = zod_1.z.object({ body: receivableBodySchema });
exports.updateAccountingReceivableSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.uuid() }),
    body: receivableBodySchema,
});
exports.deleteAccountingReceivableSchema = exports.getAccountingReceivableByIdSchema;
exports.updateAccountingReceivableStatusSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.uuid() }),
    body: zod_1.z.object({ status: zod_1.z.enum(enums_1.AccountingReceivableStatus) }),
});
exports.recordAccountingReceivablePaymentSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.uuid() }),
    body: zod_1.z.object({ amount: zod_1.z.coerce.number().positive().max(999999999) }),
});
