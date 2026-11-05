"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChaplainProductOrdersSchema = exports.updateChaplainProductOrderStatusSchema = exports.attachPaymentSessionSchema = exports.checkoutContextSchema = exports.initiateChaplainOrderPaymentSchema = exports.createChaplainProductOrderSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
exports.createChaplainProductOrderSchema = zod_1.z
    .object({
    productId: zod_1.z.string().trim().min(1).max(150),
    quantity: zod_1.z.coerce.number().int().min(1).max(99),
    customerName: zod_1.z.string().trim().min(2).max(180),
    customerEmail: zod_1.z.email().max(255),
    customerPhone: zod_1.z.string().trim().min(7).max(40),
    fulfillmentMethod: zod_1.z.enum(enums_1.ChaplainOrderFulfillmentMethod),
    deliveryAddress: zod_1.z.string().trim().max(500).nullable().optional(),
    customerNotes: zod_1.z.string().trim().max(1000).nullable().optional(),
    paymentMethod: zod_1.z.enum(enums_1.ChaplainOrderPaymentMethod),
    paymentGateway: zod_1.z.enum(enums_1.PaymentGateway).nullable().optional(),
})
    .superRefine((value, context) => {
    var _a;
    if (value.fulfillmentMethod === enums_1.ChaplainOrderFulfillmentMethod.DELIVERY &&
        !((_a = value.deliveryAddress) === null || _a === void 0 ? void 0 : _a.trim())) {
        context.addIssue({
            code: 'custom',
            path: ['deliveryAddress'],
            message: 'Delivery address is required for delivery orders',
        });
    }
    if (value.paymentMethod === enums_1.ChaplainOrderPaymentMethod.ONLINE &&
        !value.paymentGateway) {
        context.addIssue({
            code: 'custom',
            path: ['paymentGateway'],
            message: 'Select Xendit or PayPal for online payment',
        });
    }
});
exports.initiateChaplainOrderPaymentSchema = zod_1.z.object({
    checkoutToken: zod_1.z.string().uuid(),
});
exports.checkoutContextSchema = zod_1.z.object({
    checkoutToken: zod_1.z.string().uuid(),
});
exports.attachPaymentSessionSchema = zod_1.z.object({
    checkoutToken: zod_1.z.string().uuid(),
    providerCheckoutId: zod_1.z.string().trim().min(1).max(255),
    providerCheckoutUrl: zod_1.z.url().max(2048),
});
exports.updateChaplainProductOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(enums_1.ChaplainOrderStatus),
});
exports.getChaplainProductOrdersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(200).optional(),
        search: zod_1.z.string().trim().max(180).optional(),
        status: zod_1.z.enum(enums_1.ChaplainOrderStatus).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
