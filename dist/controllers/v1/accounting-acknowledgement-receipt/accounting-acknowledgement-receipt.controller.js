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
exports.deleteAcknowledgementReceipt = exports.createAcknowledgementReceipt = exports.getAcknowledgementReceiptById = exports.getAcknowledgementReceipts = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const receiptInclude = {
    items: { orderBy: { sortOrder: 'asc' } },
};
const toDecimal = (value) => new client_1.Prisma.Decimal(value !== null && value !== void 0 ? value : 0).toDecimalPlaces(2);
const trimToNull = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const parseDate = (value) => new Date(value);
const calculateTotal = (body) => body.items
    .reduce((total, item) => total.add(toDecimal(item.amount)), new client_1.Prisma.Decimal(0))
    .toDecimalPlaces(2);
const buildNextReceiptNo = (tx_1, ...args_1) => __awaiter(void 0, [tx_1, ...args_1], void 0, function* (tx, date = new Date()) {
    const yearSuffix = String(date.getFullYear()).slice(-2);
    const prefix = `AR-${yearSuffix}-`;
    const latestReceipt = yield tx.accountingAcknowledgementReceipt.findFirst({
        where: { receiptNo: { startsWith: prefix } },
        orderBy: { receiptNo: 'desc' },
        select: { receiptNo: true },
    });
    const latestSeries = (latestReceipt === null || latestReceipt === void 0 ? void 0 : latestReceipt.receiptNo)
        ? Number.parseInt(latestReceipt.receiptNo.slice(prefix.length), 10)
        : 0;
    const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
    return `${prefix}${String(nextSeries).padStart(4, '0')}`;
});
const buildReceiptData = (body) => ({
    organization: body.organization,
    name: body.name.trim(),
    receiptDate: parseDate(body.receiptDate),
    course: trimToNull(body.course),
    school: trimToNull(body.school),
    paymentType: body.paymentType,
    checkNo: trimToNull(body.checkNo),
    cashier: trimToNull(body.cashier),
    remarks: trimToNull(body.remarks),
    totalAmount: calculateTotal(body),
});
const buildReceiptItemsData = (body) => body.items.map((item, index) => ({
    particulars: item.particulars.trim(),
    amount: toDecimal(item.amount),
    remarks: trimToNull(item.remarks),
    sortOrder: index,
}));
const getAcknowledgementReceipts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const query = req.query;
        const page = Math.max(Number.parseInt((_a = query.page) !== null && _a !== void 0 ? _a : '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt((_b = query.limit) !== null && _b !== void 0 ? _b : '10', 10), 1), 100);
        const skip = (page - 1) * limit;
        const search = (_c = query.search) === null || _c === void 0 ? void 0 : _c.trim();
        const where = Object.assign({ organization: query.organization }, (search
            ? {
                OR: [
                    { receiptNo: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { course: { contains: search, mode: 'insensitive' } },
                    { school: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}));
        const [receipts, total, summaryRows] = yield Promise.all([
            prisma_1.prisma.accountingAcknowledgementReceipt.findMany({
                where,
                include: receiptInclude,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.accountingAcknowledgementReceipt.count({ where }),
            prisma_1.prisma.accountingAcknowledgementReceipt.findMany({
                where,
                select: { totalAmount: true, organization: true },
            }),
        ]);
        const summary = {
            cards: {
                receipts: total,
                totalAmount: summaryRows.reduce((sum, receipt) => sum + Number(receipt.totalAmount), 0),
            },
            organizations: summaryRows.reduce((acc, receipt) => {
                var _a;
                acc[receipt.organization] = ((_a = acc[receipt.organization]) !== null && _a !== void 0 ? _a : 0) + 1;
                return acc;
            }, {}),
        };
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Acknowledgement receipts retrieved successfully',
            data: receipts,
            summary,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting acknowledgement receipts', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAcknowledgementReceipts = getAcknowledgementReceipts;
const getAcknowledgementReceiptById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const receipt = yield prisma_1.prisma.accountingAcknowledgementReceipt.findUnique({
            where: { id: String(req.params.id) },
            include: receiptInclude,
        });
        if (!receipt) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Acknowledgement receipt not found',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Acknowledgement receipt retrieved successfully',
            data: receipt,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting acknowledgement receipt', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAcknowledgementReceiptById = getAcknowledgementReceiptById;
const createAcknowledgementReceipt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const receipt = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const receiptNo = yield buildNextReceiptNo(tx, new Date(body.receiptDate));
            return tx.accountingAcknowledgementReceipt.create({
                data: Object.assign(Object.assign({}, buildReceiptData(body)), { receiptNo, items: { create: buildReceiptItemsData(body) } }),
                include: receiptInclude,
            });
        }));
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Acknowledgement receipt created successfully',
            data: receipt,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating acknowledgement receipt', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createAcknowledgementReceipt = createAcknowledgementReceipt;
const deleteAcknowledgementReceipt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = String(req.params.id);
        const exists = yield prisma_1.prisma.accountingAcknowledgementReceipt.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!exists) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Acknowledgement receipt not found',
            });
            return;
        }
        yield prisma_1.prisma.accountingAcknowledgementReceipt.delete({ where: { id } });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Acknowledgement receipt deleted successfully',
        });
    }
    catch (err) {
        winston_1.logger.error('Error while deleting acknowledgement receipt', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.deleteAcknowledgementReceipt = deleteAcknowledgementReceipt;
