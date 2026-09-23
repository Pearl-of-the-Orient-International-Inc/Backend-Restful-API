"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.receivePayPalWebhook = exports.receiveXenditWebhook = exports.capturePublicPayPalOrder = exports.initiateChaplainOrderPayment = exports.getPublicPaymentStatus = exports.getPublicPaymentConfiguration = exports.getPublicPaymentFeePolicies = void 0;
const node_crypto_1 = require("node:crypto");
const http_codes_1 = require("../../../common/http-codes");
const config_1 = __importDefault(require("../../../config"));
const enums_1 = require("../../../generated/prisma/enums");
const payment_gateways_1 = require("../../../lib/payment-gateways");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const payment_fees_1 = require("../../../lib/payment-fees");
const getPublicPaymentFeePolicies = (_req, res) => {
    res.status(http_codes_1.HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Payment fee policies retrieved successfully',
        data: payment_fees_1.paymentFeePolicies,
    });
};
exports.getPublicPaymentFeePolicies = getPublicPaymentFeePolicies;
const getPublicPaymentConfiguration = (_req, res) => {
    var _a;
    res.status(http_codes_1.HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Public payment configuration retrieved successfully',
        data: { paypalClientId: (_a = config_1.default.PAYPAL_CLIENT_ID) !== null && _a !== void 0 ? _a : null },
    });
};
exports.getPublicPaymentConfiguration = getPublicPaymentConfiguration;
const getPublicPaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const reference = typeof req.params.reference === 'string' ? req.params.reference : '';
        if (!/^PAY-[A-Z0-9-]{10,50}$/.test(reference)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Invalid payment reference' });
            return;
        }
        const payment = yield prisma_1.prisma.paymentTransaction.findUnique({
            where: { reference },
            select: {
                reference: true,
                amount: true,
                currency: true,
                gateway: true,
                status: true,
                providerStatus: true,
                failureReason: true,
                paidAt: true,
                createdAt: true,
                chaplainProductOrder: { select: { orderNumber: true } },
            },
        });
        if (!payment) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Payment reference not found' });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Payment status retrieved successfully',
            data: Object.assign(Object.assign({}, payment), { amount: Number(payment.amount), orderNumber: (_b = (_a = payment.chaplainProductOrder) === null || _a === void 0 ? void 0 : _a.orderNumber) !== null && _b !== void 0 ? _b : null, chaplainProductOrder: undefined }),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while fetching public payment status', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getPublicPaymentStatus = getPublicPaymentStatus;
const safeEqual = (received, expected) => {
    if (!expected)
        return false;
    const left = Buffer.from(received);
    const right = Buffer.from(expected);
    return left.length === right.length && (0, node_crypto_1.timingSafeEqual)(left, right);
};
const paymentReference = () => `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(0, node_crypto_1.randomUUID)().slice(0, 10).toUpperCase()}`;
const syncPaidTransaction = (gatewayReference, providerStatus, providerAmount, providerCurrency) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield prisma_1.prisma.paymentTransaction.findUnique({
        where: { gatewayReference },
    });
    if (!transaction || transaction.status === enums_1.PaymentTransactionStatus.PAID)
        return;
    if ((providerAmount !== undefined &&
        Number(transaction.amount) !== providerAmount) ||
        (providerCurrency !== undefined &&
            transaction.currency !== providerCurrency)) {
        throw new Error('Provider payment amount or currency does not match');
    }
    yield prisma_1.prisma.$transaction([
        prisma_1.prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
                status: enums_1.PaymentTransactionStatus.PAID,
                providerStatus,
                paidAt: new Date(),
            },
        }),
        ...(transaction.chaplainProductOrderId
            ? [
                prisma_1.prisma.chaplainProductOrder.update({
                    where: { id: transaction.chaplainProductOrderId },
                    data: {
                        paymentStatus: enums_1.ChaplainOrderPaymentStatus.PAID,
                        status: enums_1.ChaplainOrderStatus.PAID,
                    },
                }),
            ]
            : []),
    ]);
});
const syncNonPaidTransaction = (gatewayReference, status, providerStatus, failureReason) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield prisma_1.prisma.paymentTransaction.findUnique({
        where: { gatewayReference },
    });
    if (!transaction || transaction.status === enums_1.PaymentTransactionStatus.PAID)
        return;
    const orderPaymentStatus = status;
    yield prisma_1.prisma.$transaction([
        prisma_1.prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: { status, providerStatus, failureReason },
        }),
        ...(transaction.chaplainProductOrderId
            ? [
                prisma_1.prisma.chaplainProductOrder.update({
                    where: { id: transaction.chaplainProductOrderId },
                    data: { paymentStatus: orderPaymentStatus },
                }),
            ]
            : []),
    ]);
});
const initiateChaplainOrderPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    let transactionId = null;
    try {
        const order = yield prisma_1.prisma.chaplainProductOrder.findFirst({
            where: {
                id,
                checkoutToken: String((_a = req.body.checkoutToken) !== null && _a !== void 0 ? _a : ''),
                paymentMethod: enums_1.ChaplainOrderPaymentMethod.ONLINE,
                paymentStatus: {
                    in: [
                        enums_1.ChaplainOrderPaymentStatus.PENDING,
                        enums_1.ChaplainOrderPaymentStatus.FAILED,
                    ],
                },
                status: enums_1.ChaplainOrderStatus.PENDING,
            },
            include: {
                product: true,
                paymentTransactions: {
                    where: { status: enums_1.PaymentTransactionStatus.PENDING },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        if (!order) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Eligible order checkout was not found',
            });
            return;
        }
        const existing = order.paymentTransactions[0];
        if (existing === null || existing === void 0 ? void 0 : existing.checkoutUrl) {
            res.status(http_codes_1.HTTPSTATUS.OK).json({
                code: 'OK',
                message: 'Existing payment checkout retrieved',
                data: {
                    reference: existing.reference,
                    checkoutUrl: existing.checkoutUrl,
                    gatewayReference: existing.gatewayReference,
                },
            });
            return;
        }
        const gateway = order.paymentGateway;
        if (!Object.values(enums_1.PaymentGateway).includes(gateway)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'INVALID_GATEWAY',
                message: 'Select Xendit or PayPal for this order',
            });
            return;
        }
        const reference = paymentReference();
        const transaction = yield prisma_1.prisma.paymentTransaction.create({
            data: {
                reference,
                amount: order.total,
                currency: 'PHP',
                purpose: enums_1.PaymentPurpose.CHAPLAIN_PRODUCT_ORDER,
                payerReference: (_b = order.customerUserId) !== null && _b !== void 0 ? _b : order.customerEmail,
                gateway,
                chaplainProductOrderId: order.id,
                metadata: {
                    orderNumber: order.orderNumber,
                    productId: order.productId,
                    customerEmail: order.customerEmail,
                },
            },
        });
        transactionId = transaction.id;
        const checkoutInput = {
            reference,
            amount: Number(order.total),
            currency: 'PHP',
            description: `${order.product.name} (${order.orderNumber})`,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
        };
        const checkout = gateway === enums_1.PaymentGateway.XENDIT
            ? yield (0, payment_gateways_1.createXenditCheckout)(checkoutInput)
            : yield (0, payment_gateways_1.createPayPalCheckout)(checkoutInput);
        yield prisma_1.prisma.$transaction([
            prisma_1.prisma.paymentTransaction.update({
                where: { id: transaction.id },
                data: {
                    gatewayReference: checkout.gatewayReference,
                    checkoutUrl: checkout.checkoutUrl,
                    providerStatus: checkout.providerStatus,
                    expiresAt: checkout.expiresAt,
                },
            }),
            prisma_1.prisma.chaplainProductOrder.update({
                where: { id: order.id },
                data: {
                    paymentStatus: enums_1.ChaplainOrderPaymentStatus.PENDING,
                    providerCheckoutId: checkout.gatewayReference,
                    providerCheckoutUrl: checkout.checkoutUrl,
                },
            }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Payment checkout created successfully',
            data: { reference, checkoutUrl: checkout.checkoutUrl, gatewayReference: checkout.gatewayReference },
        });
    }
    catch (err) {
        if (transactionId) {
            yield prisma_1.prisma.paymentTransaction
                .update({
                where: { id: transactionId },
                data: {
                    status: enums_1.PaymentTransactionStatus.FAILED,
                    providerStatus: 'CHECKOUT_CREATION_FAILED',
                    failureReason: err instanceof Error ? err.message : 'Unknown provider error',
                },
            })
                .catch(() => undefined);
        }
        winston_1.logger.error('Error while initiating product payment', { err });
        res.status(http_codes_1.HTTPSTATUS.BAD_GATEWAY).json({
            code: 'PAYMENT_GATEWAY_ERROR',
            message: err instanceof Error ? err.message : 'Payment gateway unavailable',
        });
    }
});
exports.initiateChaplainOrderPayment = initiateChaplainOrderPayment;
const capturePublicPayPalOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orderId = typeof req.params.orderId === 'string' ? req.params.orderId : '';
        const checkoutToken = String((_a = req.body.checkoutToken) !== null && _a !== void 0 ? _a : '');
        const transaction = yield prisma_1.prisma.paymentTransaction.findFirst({
            where: {
                gateway: enums_1.PaymentGateway.PAYPAL,
                gatewayReference: orderId,
                chaplainProductOrder: { checkoutToken },
            },
            select: { gatewayReference: true, reference: true, status: true },
        });
        if (!(transaction === null || transaction === void 0 ? void 0 : transaction.gatewayReference)) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Eligible PayPal checkout was not found' });
            return;
        }
        if (transaction.status !== enums_1.PaymentTransactionStatus.PAID) {
            const capture = yield (0, payment_gateways_1.capturePayPalOrder)(transaction.gatewayReference);
            if (capture.status !== 'COMPLETED') {
                res.status(http_codes_1.HTTPSTATUS.BAD_GATEWAY).json({ code: 'PAYMENT_PENDING', message: 'PayPal has not completed this payment yet' });
                return;
            }
            yield syncPaidTransaction(transaction.gatewayReference, capture.status);
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'PayPal payment captured successfully', data: { reference: transaction.reference, status: 'PAID' } });
    }
    catch (err) {
        winston_1.logger.error('Error while capturing PayPal order', { err });
        res.status(http_codes_1.HTTPSTATUS.BAD_GATEWAY).json({ code: 'PAYMENT_GATEWAY_ERROR', message: err instanceof Error ? err.message : 'Unable to capture PayPal payment' });
    }
});
exports.capturePublicPayPalOrder = capturePublicPayPalOrder;
const receiveXenditWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        if (!safeEqual(String((_a = req.headers['x-callback-token']) !== null && _a !== void 0 ? _a : ''), config_1.default.XENDIT_WEBHOOK_TOKEN)) {
            res
                .status(http_codes_1.HTTPSTATUS.UNAUTHORIZED)
                .json({ code: 'UNAUTHORIZED', message: 'Invalid webhook token' });
            return;
        }
        const event = String((_b = req.body.event) !== null && _b !== void 0 ? _b : '');
        const data = ((_c = req.body.data) !== null && _c !== void 0 ? _c : {});
        const gatewayReference = String((_e = (_d = data.payment_session_id) !== null && _d !== void 0 ? _d : data.id) !== null && _e !== void 0 ? _e : '');
        if (!gatewayReference) {
            res
                .status(http_codes_1.HTTPSTATUS.BAD_REQUEST)
                .json({ code: 'BAD_REQUEST', message: 'Missing payment session ID' });
            return;
        }
        if (event === 'payment_session.completed') {
            yield syncPaidTransaction(gatewayReference, String((_f = data.status) !== null && _f !== void 0 ? _f : 'COMPLETED'), data.amount === undefined ? undefined : Number(data.amount), data.currency === undefined ? undefined : String(data.currency));
        }
        else if (event.includes('expired')) {
            yield syncNonPaidTransaction(gatewayReference, enums_1.PaymentTransactionStatus.EXPIRED, String((_g = data.status) !== null && _g !== void 0 ? _g : 'EXPIRED'));
        }
        else if (event.includes('cancel')) {
            yield syncNonPaidTransaction(gatewayReference, enums_1.PaymentTransactionStatus.CANCELLED, String((_h = data.status) !== null && _h !== void 0 ? _h : 'CANCELLED'));
        }
        else if (event.includes('fail')) {
            yield syncNonPaidTransaction(gatewayReference, enums_1.PaymentTransactionStatus.FAILED, String((_j = data.status) !== null && _j !== void 0 ? _j : 'FAILED'));
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({ received: true });
    }
    catch (err) {
        winston_1.logger.error('Error while processing Xendit webhook', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Webhook processing failed',
        });
    }
});
exports.receiveXenditWebhook = receiveXenditWebhook;
const receivePayPalWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        if (!config_1.default.PAYPAL_WEBHOOK_ID)
            throw new Error('PAYPAL_WEBHOOK_ID is not configured');
        const accessToken = yield (0, payment_gateways_1.getPayPalAccessToken)();
        const verificationResponse = yield fetch(`${config_1.default.PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                auth_algo: req.headers['paypal-auth-algo'],
                cert_url: req.headers['paypal-cert-url'],
                transmission_id: req.headers['paypal-transmission-id'],
                transmission_sig: req.headers['paypal-transmission-sig'],
                transmission_time: req.headers['paypal-transmission-time'],
                webhook_id: config_1.default.PAYPAL_WEBHOOK_ID,
                webhook_event: req.body,
            }),
        });
        const verification = (yield verificationResponse.json());
        if (!verificationResponse.ok ||
            verification.verification_status !== 'SUCCESS') {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Invalid PayPal webhook signature',
            });
            return;
        }
        const eventType = String((_a = req.body.event_type) !== null && _a !== void 0 ? _a : '');
        const resource = ((_b = req.body.resource) !== null && _b !== void 0 ? _b : {});
        if (eventType !== 'CHECKOUT.ORDER.APPROVED') {
            const supplementary = resource.supplementary_data;
            const orderId = (_d = (_c = supplementary === null || supplementary === void 0 ? void 0 : supplementary.related_ids) === null || _c === void 0 ? void 0 : _c.order_id) !== null && _d !== void 0 ? _d : String((_e = resource.id) !== null && _e !== void 0 ? _e : '');
            if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
                yield syncPaidTransaction(orderId, 'COMPLETED');
            }
            else if (eventType === 'PAYMENT.CAPTURE.DENIED' ||
                eventType === 'CHECKOUT.ORDER.DECLINED') {
                yield syncNonPaidTransaction(orderId, enums_1.PaymentTransactionStatus.FAILED, eventType);
            }
            else if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
                yield syncNonPaidTransaction(orderId, enums_1.PaymentTransactionStatus.REFUNDED, eventType);
            }
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({ received: true });
    }
    catch (err) {
        winston_1.logger.error('Error while processing PayPal webhook', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Webhook processing failed',
        });
    }
});
exports.receivePayPalWebhook = receivePayPalWebhook;
