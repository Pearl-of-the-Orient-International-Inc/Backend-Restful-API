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
exports.deleteChaplainProduct = exports.updateChaplainProduct = exports.createChaplainProduct = exports.getChaplainProducts = exports.getPublicChaplainProduct = exports.getPublicChaplainProducts = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getStockStatus = (stockQuantity, lowStockThreshold) => {
    if (stockQuantity === 0)
        return 'OUT_OF_STOCK';
    if (stockQuantity <= lowStockThreshold)
        return 'LOW_STOCK';
    return 'IN_STOCK';
};
const serializeProduct = (product) => (Object.assign(Object.assign({}, product), { price: Number(product.price), stockStatus: getStockStatus(product.stockQuantity, product.lowStockThreshold), isAvailable: product.isActive && product.stockQuantity > 0 }));
const toWriteData = (body) => {
    var _a, _b;
    return ({
        slug: body.slug,
        name: body.name,
        description: ((_a = body.description) === null || _a === void 0 ? void 0 : _a.trim()) || null,
        category: body.category,
        price: body.price,
        stockQuantity: body.stockQuantity,
        lowStockThreshold: body.lowStockThreshold,
        imageUrl: body.imageUrl,
        imageFileName: ((_b = body.imageFileName) === null || _b === void 0 ? void 0 : _b.trim()) || null,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
    });
};
const getIdentifier = (req) => {
    const id = req.params.id;
    return typeof id === 'string' && id.trim() ? id.trim() : null;
};
const getPublicChaplainProducts = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield prisma_1.prisma.chaplainProduct.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public chaplain products retrieved successfully',
            data: products.map(serializeProduct),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving public chaplain products', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicChaplainProducts = getPublicChaplainProducts;
const getPublicChaplainProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const identifier = getIdentifier(req);
        if (!identifier) {
            res
                .status(http_codes_1.HTTPSTATUS.BAD_REQUEST)
                .json({ code: 'BAD_REQUEST', message: 'Product ID is required' });
            return;
        }
        const product = yield prisma_1.prisma.chaplainProduct.findFirst({
            where: {
                isActive: true,
                OR: [{ id: identifier }, { slug: identifier }],
            },
        });
        if (!product) {
            res
                .status(http_codes_1.HTTPSTATUS.NOT_FOUND)
                .json({ code: 'NOT_FOUND', message: 'Product not found' });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public chaplain product retrieved successfully',
            data: serializeProduct(product),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving public chaplain product', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicChaplainProduct = getPublicChaplainProduct;
const getChaplainProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 100;
        const search = String((_a = req.query.search) !== null && _a !== void 0 ? _a : '').trim();
        const category = req.query.category;
        const isActive = req.query.isActive === 'true'
            ? true
            : req.query.isActive === 'false'
                ? false
                : undefined;
        const sortBy = String((_b = req.query.sortBy) !== null && _b !== void 0 ? _b : 'sortOrder');
        const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
        const allowedSortFields = new Set([
            'name',
            'price',
            'stockQuantity',
            'sortOrder',
            'createdAt',
            'updatedAt',
        ]);
        const orderField = allowedSortFields.has(sortBy) ? sortBy : 'sortOrder';
        const where = Object.assign(Object.assign(Object.assign({}, (search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                    {
                        description: { contains: search, mode: 'insensitive' },
                    },
                ],
            }
            : {})), (category ? { category: category } : {})), (typeof isActive === 'boolean' ? { isActive } : {}));
        const [totalCount, products] = yield Promise.all([
            prisma_1.prisma.chaplainProduct.count({ where }),
            prisma_1.prisma.chaplainProduct.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: [{ [orderField]: sortOrder }, { name: 'asc' }],
            }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Chaplain products retrieved successfully',
            data: products.map(serializeProduct),
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
        winston_1.logger.error('Error while retrieving chaplain products', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getChaplainProducts = getChaplainProducts;
const createChaplainProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield prisma_1.prisma.chaplainProduct.create({
            data: toWriteData(req.body),
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Chaplain product created successfully',
            data: serializeProduct(product),
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002') {
            res
                .status(http_codes_1.HTTPSTATUS.CONFLICT)
                .json({ code: 'CONFLICT', message: 'Product slug already exists' });
            return;
        }
        winston_1.logger.error('Error while creating chaplain product', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createChaplainProduct = createChaplainProduct;
const updateChaplainProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getIdentifier(req);
        if (!id) {
            res
                .status(http_codes_1.HTTPSTATUS.BAD_REQUEST)
                .json({ code: 'BAD_REQUEST', message: 'Product ID is required' });
            return;
        }
        const product = yield prisma_1.prisma.chaplainProduct.update({
            where: { id },
            data: toWriteData(req.body),
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Chaplain product updated successfully',
            data: serializeProduct(product),
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002') {
            res
                .status(http_codes_1.HTTPSTATUS.CONFLICT)
                .json({ code: 'CONFLICT', message: 'Product slug already exists' });
            return;
        }
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2025') {
            res
                .status(http_codes_1.HTTPSTATUS.NOT_FOUND)
                .json({ code: 'NOT_FOUND', message: 'Product not found' });
            return;
        }
        winston_1.logger.error('Error while updating chaplain product', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateChaplainProduct = updateChaplainProduct;
const deleteChaplainProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getIdentifier(req);
        if (!id) {
            res
                .status(http_codes_1.HTTPSTATUS.BAD_REQUEST)
                .json({ code: 'BAD_REQUEST', message: 'Product ID is required' });
            return;
        }
        yield prisma_1.prisma.chaplainProduct.delete({ where: { id } });
        res
            .status(http_codes_1.HTTPSTATUS.OK)
            .json({ code: 'OK', message: 'Chaplain product deleted successfully' });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2025') {
            res
                .status(http_codes_1.HTTPSTATUS.NOT_FOUND)
                .json({ code: 'NOT_FOUND', message: 'Product not found' });
            return;
        }
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2003') {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'PRODUCT_HAS_ORDERS',
                message: 'This product has order history and cannot be deleted. Mark it inactive instead.',
            });
            return;
        }
        winston_1.logger.error('Error while deleting chaplain product', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.deleteChaplainProduct = deleteChaplainProduct;
