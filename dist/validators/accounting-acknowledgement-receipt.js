"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAcknowledgementReceiptSchema = exports.createAcknowledgementReceiptSchema = exports.getAcknowledgementReceiptByIdSchema = exports.getAcknowledgementReceiptsSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const optionalText = (max = 255) => zod_1.z.string().trim().max(max).optional().or(zod_1.z.literal(''));
const dateStringSchema = zod_1.z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'date must be a valid date',
});
const moneySchema = zod_1.z.coerce.number().min(0).max(999999999);
const receiptItemSchema = zod_1.z.object({
    particulars: zod_1.z.string().trim().min(1).max(255),
    amount: moneySchema.optional(),
    remarks: optionalText(255),
});
const receiptBodySchema = zod_1.z.object({
    organization: zod_1.z.enum(enums_1.ReceiptOrganization),
    name: zod_1.z.string().trim().min(1).max(150),
    receiptDate: dateStringSchema,
    course: optionalText(150),
    school: optionalText(150),
    paymentType: zod_1.z.enum(enums_1.ReceiptPaymentType).optional().default(enums_1.ReceiptPaymentType.CASH),
    checkNo: optionalText(100),
    cashier: optionalText(150),
    remarks: optionalText(500),
    items: zod_1.z.array(receiptItemSchema).min(1).max(100),
});
exports.getAcknowledgementReceiptsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
            message: 'page must be a positive integer',
        }),
        limit: zod_1.z.string().optional().refine((value) => !value || /^\d+$/.test(value), {
            message: 'limit must be a positive integer',
        }),
        search: optionalText(100),
        organization: zod_1.z.enum(enums_1.ReceiptOrganization).optional(),
    }),
});
exports.getAcknowledgementReceiptByIdSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.uuid() }),
});
exports.createAcknowledgementReceiptSchema = zod_1.z.object({ body: receiptBodySchema });
exports.deleteAcknowledgementReceiptSchema = exports.getAcknowledgementReceiptByIdSchema;
