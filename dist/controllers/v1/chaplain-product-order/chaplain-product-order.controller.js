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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChaplainProductOrderStatus = exports.getChaplainProductOrders = exports.attachOrderPaymentSession = exports.getOrderCheckoutContext = exports.createChaplainProductOrder = void 0;
const node_crypto_1 = require("node:crypto");
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const payment_fees_1 = require("../../../lib/payment-fees");
const winston_1 = require("../../../lib/winston");
const orderInclude = {
    product: true,
    customerUser: {
        select: { id: true, name: true, email: true },
    },
    paymentTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
    },
};
const serializeOrder = (order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    productId: order.productId,
    product: {
        id: order.product.id,
        name: order.product.name,
        slug: order.product.slug,
        imageUrl: order.product.imageUrl,
    },
    quantity: order.quantity,
    unitPrice: Number(order.unitPrice),
    subtotal: Number(order.subtotal),
    taxAmount: Number(order.taxAmount),
    platformFee: Number(order.platformFee),
    total: Number(order.total),
    customerUser: order.customerUser,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    fulfillmentMethod: order.fulfillmentMethod,
    deliveryAddress: order.deliveryAddress,
    customerNotes: order.customerNotes,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentGateway: order.paymentGateway,
    providerCheckoutId: order.providerCheckoutId,
    providerCheckoutUrl: order.providerCheckoutUrl,
    latestPayment: order.paymentTransactions[0]
        ? {
            id: order.paymentTransactions[0].id,
            reference: order.paymentTransactions[0].reference,
            amount: Number(order.paymentTransactions[0].amount),
            currency: order.paymentTransactions[0].currency,
            purpose: order.paymentTransactions[0].purpose,
            gateway: order.paymentTransactions[0].gateway,
            gatewayReference: order.paymentTransactions[0].gatewayReference,
            status: order.paymentTransactions[0].status,
            providerStatus: order.paymentTransactions[0].providerStatus,
            failureReason: order.paymentTransactions[0].failureReason,
            paidAt: order.paymentTransactions[0].paidAt,
            expiresAt: order.paymentTransactions[0].expiresAt,
            createdAt: order.paymentTransactions[0].createdAt,
        }
        : null,
    status: order.status,
    inventoryReleasedAt: order.inventoryReleasedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
});
const orderNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `CP-${date}-${(0, node_crypto_1.randomUUID)().slice(0, 8).toUpperCase()}`;
};
const getId = (req) => {
    const id = req.params.id;
    return typeof id === 'string' && id.trim() ? id.trim() : null;
};
const createChaplainProductOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const order = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const product = yield tx.chaplainProduct.findFirst({
                where: { id: body.productId, isActive: true },
            });
            if (!product) {
                throw new Error('PRODUCT_UNAVAILABLE');
            }
            const reserved = yield tx.chaplainProduct.updateMany({
                where: {
                    id: product.id,
                    isActive: true,
                    stockQuantity: { gte: body.quantity },
                },
                data: { stockQuantity: { decrement: body.quantity } },
            });
            if (reserved.count !== 1) {
                throw new Error('INSUFFICIENT_STOCK');
            }
            const unitPrice = Number(product.price);
            const subtotal = Number((unitPrice * body.quantity).toFixed(2));
            const taxAmount = Number((subtotal * 0.12).toFixed(2));
            const gateway = body.paymentMethod === enums_1.ChaplainOrderPaymentMethod.ONLINE
                ? body.paymentGateway
                : null;
            const platformFee = (0, payment_fees_1.calculatePlatformFee)(subtotal + taxAmount, gateway);
            const total = Number((subtotal + taxAmount + platformFee).toFixed(2));
            return tx.chaplainProductOrder.create({
                data: {
                    orderNumber: orderNumber(),
                    productId: product.id,
                    quantity: body.quantity,
                    unitPrice,
                    subtotal,
                    taxAmount,
                    platformFee,
                    total,
                    customerUserId: (_a = req.userId) !== null && _a !== void 0 ? _a : null,
                    customerName: body.customerName,
                    customerEmail: body.customerEmail.toLowerCase(),
                    customerPhone: body.customerPhone,
                    fulfillmentMethod: body.fulfillmentMethod,
                    deliveryAddress: body.fulfillmentMethod === 'DELIVERY'
                        ? ((_b = body.deliveryAddress) === null || _b === void 0 ? void 0 : _b.trim()) || null
                        : null,
                    customerNotes: ((_c = body.customerNotes) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                    paymentMethod: body.paymentMethod,
                    paymentGateway: gateway,
                },
                include: orderInclude,
            });
        }));
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Chaplain product order submitted successfully',
            data: Object.assign(Object.assign({}, serializeOrder(order)), { checkoutToken: order.checkoutToken }),
        });
    }
    catch (err) {
        if (err instanceof Error &&
            (err.message === 'PRODUCT_UNAVAILABLE' ||
                err.message === 'INSUFFICIENT_STOCK')) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'INSUFFICIENT_STOCK',
                message: err.message === 'PRODUCT_UNAVAILABLE'
                    ? 'This product is no longer available'
                    : 'The requested quantity is no longer available',
            });
            return;
        }
        winston_1.logger.error('Error while creating chaplain product order', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createChaplainProductOrder = createChaplainProductOrder;
const getOrderCheckoutContext = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = getId(req);
        const checkoutToken = String((_a = req.body.checkoutToken) !== null && _a !== void 0 ? _a : '');
        const order = id
            ? yield prisma_1.prisma.chaplainProductOrder.findFirst({
                where: {
                    id,
                    checkoutToken,
                    paymentMethod: enums_1.ChaplainOrderPaymentMethod.ONLINE,
                    paymentStatus: enums_1.ChaplainOrderPaymentStatus.PENDING,
                    status: enums_1.ChaplainOrderStatus.PENDING,
                },
                include: { product: true },
            })
            : null;
        if (!order) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Eligible order checkout was not found',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Order checkout context retrieved successfully',
            data: {
                id: order.id,
                orderNumber: order.orderNumber,
                productName: order.product.name,
                quantity: order.quantity,
                subtotal: Number(order.subtotal),
                taxAmount: Number(order.taxAmount),
                total: Number(order.total),
                customerEmail: order.customerEmail,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving order checkout context', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getOrderCheckoutContext = getOrderCheckoutContext;
const attachOrderPaymentSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = getId(req);
        if (!id) {
            res
                .status(http_codes_1.HTTPSTATUS.BAD_REQUEST)
                .json({ code: 'BAD_REQUEST', message: 'Order ID is required' });
            return;
        }
        const updated = yield prisma_1.prisma.chaplainProductOrder.updateMany({
            where: {
                id,
                checkoutToken: String((_a = req.body.checkoutToken) !== null && _a !== void 0 ? _a : ''),
                paymentMethod: enums_1.ChaplainOrderPaymentMethod.ONLINE,
                paymentStatus: enums_1.ChaplainOrderPaymentStatus.PENDING,
            },
            data: {
                providerCheckoutId: String(req.body.providerCheckoutId),
                providerCheckoutUrl: String(req.body.providerCheckoutUrl),
            },
        });
        if (updated.count !== 1) {
            res
                .status(http_codes_1.HTTPSTATUS.NOT_FOUND)
                .json({ code: 'NOT_FOUND', message: 'Eligible order was not found' });
            return;
        }
        res
            .status(http_codes_1.HTTPSTATUS.OK)
            .json({ code: 'OK', message: 'Payment session attached successfully' });
    }
    catch (err) {
        winston_1.logger.error('Error while attaching order payment session', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.attachOrderPaymentSession = attachOrderPaymentSession;
const getChaplainProductOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 100;
        const search = String((_a = req.query.search) !== null && _a !== void 0 ? _a : '').trim();
        const status = req.query.status;
        const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
        const where = Object.assign(Object.assign({}, (status ? { status } : {})), (search
            ? {
                OR: [
                    {
                        orderNumber: { contains: search, mode: 'insensitive' },
                    },
                    {
                        customerName: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        customerEmail: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        product: {
                            name: { contains: search, mode: 'insensitive' },
                        },
                    },
                ],
            }
            : {}));
        const [totalCount, orders] = yield Promise.all([
            prisma_1.prisma.chaplainProductOrder.count({ where }),
            prisma_1.prisma.chaplainProductOrder.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: sortOrder },
                include: orderInclude,
            }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Chaplain product orders retrieved successfully',
            data: orders.map(serializeOrder),
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving chaplain product orders', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getChaplainProductOrders = getChaplainProductOrders;
const allowedTransitions = {
    PENDING: [
        enums_1.ChaplainOrderStatus.PAID,
        enums_1.ChaplainOrderStatus.PROCESSING,
        enums_1.ChaplainOrderStatus.CANCELLED,
    ],
    PAID: [enums_1.ChaplainOrderStatus.PROCESSING, enums_1.ChaplainOrderStatus.REFUNDED],
    PROCESSING: [
        enums_1.ChaplainOrderStatus.READY,
        enums_1.ChaplainOrderStatus.CANCELLED,
        enums_1.ChaplainOrderStatus.REFUNDED,
    ],
    READY: [
        enums_1.ChaplainOrderStatus.COMPLETED,
        enums_1.ChaplainOrderStatus.CANCELLED,
        enums_1.ChaplainOrderStatus.REFUNDED,
    ],
    COMPLETED: [enums_1.ChaplainOrderStatus.REFUNDED],
    CANCELLED: [],
    REFUNDED: [],
};
const updateChaplainProductOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getId(req);
        const nextStatus = req.body.status;
        if (!id) {
            res
                .status(http_codes_1.HTTPSTATUS.BAD_REQUEST)
                .json({ code: 'BAD_REQUEST', message: 'Order ID is required' });
            return;
        }
        const order = yield prisma_1.prisma.chaplainProductOrder.findUnique({
            where: { id },
            include: orderInclude,
        });
        if (!order) {
            res
                .status(http_codes_1.HTTPSTATUS.NOT_FOUND)
                .json({ code: 'NOT_FOUND', message: 'Order not found' });
            return;
        }
        if (order.status !== nextStatus &&
            !allowedTransitions[order.status].includes(nextStatus)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'INVALID_STATUS_TRANSITION',
                message: `Order cannot move from ${order.status} to ${nextStatus}`,
            });
            return;
        }
        if (order.paymentMethod === enums_1.ChaplainOrderPaymentMethod.ONLINE &&
            nextStatus === enums_1.ChaplainOrderStatus.PAID &&
            order.paymentStatus !== enums_1.ChaplainOrderPaymentStatus.PAID) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'PAYMENT_NOT_VERIFIED',
                message: 'Online orders can only be marked paid after a verified provider webhook',
            });
            return;
        }
        if (order.paymentMethod === enums_1.ChaplainOrderPaymentMethod.ONLINE &&
            nextStatus === enums_1.ChaplainOrderStatus.REFUNDED &&
            order.paymentStatus !== enums_1.ChaplainOrderPaymentStatus.REFUNDED) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'REFUND_NOT_VERIFIED',
                message: 'Complete the refund with the payment provider before reconciling this order',
            });
            return;
        }
        const shouldReleaseInventory = (nextStatus === enums_1.ChaplainOrderStatus.CANCELLED ||
            nextStatus === enums_1.ChaplainOrderStatus.REFUNDED) &&
            !order.inventoryReleasedAt;
        const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            if (shouldReleaseInventory) {
                yield tx.chaplainProduct.update({
                    where: { id: order.productId },
                    data: { stockQuantity: { increment: order.quantity } },
                });
            }
            return tx.chaplainProductOrder.update({
                where: { id },
                data: Object.assign(Object.assign(Object.assign({ status: nextStatus }, (order.paymentMethod === enums_1.ChaplainOrderPaymentMethod.CASH &&
                    nextStatus === enums_1.ChaplainOrderStatus.PAID
                    ? { paymentStatus: enums_1.ChaplainOrderPaymentStatus.PAID }
                    : {})), (order.paymentMethod === enums_1.ChaplainOrderPaymentMethod.CASH &&
                    nextStatus === enums_1.ChaplainOrderStatus.REFUNDED
                    ? { paymentStatus: enums_1.ChaplainOrderPaymentStatus.REFUNDED }
                    : {})), (shouldReleaseInventory
                    ? { inventoryReleasedAt: new Date() }
                    : {})),
                include: orderInclude,
            });
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Order status updated successfully',
            data: serializeOrder(updated),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating chaplain product order status', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateChaplainProductOrderStatus = updateChaplainProductOrderStatus;
