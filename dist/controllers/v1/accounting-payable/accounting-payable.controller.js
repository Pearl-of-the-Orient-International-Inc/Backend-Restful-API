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
exports.recordAccountingPayablePayment = exports.updateAccountingPayableStatus = exports.deleteAccountingPayable = exports.updateAccountingPayable = exports.createAccountingPayable = exports.getAccountingPayableById = exports.getAccountingPayables = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const accounting_payable_shared_1 = require("./accounting-payable-shared");
const toNumber = (value) => Number(value !== null && value !== void 0 ? value : 0);
const formatMonthLabel = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const balanceOf = ({ paidAmount, totalAmount, }) => Math.max(toNumber(totalAmount) - toNumber(paidAmount), 0);
const buildPayableSummary = () => __awaiter(void 0, void 0, void 0, function* () {
    const payables = yield prisma_1.prisma.accountingPayable.findMany({
        select: {
            category: true,
            dueDate: true,
            paidAmount: true,
            status: true,
            totalAmount: true,
            billDate: true,
        },
    });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);
    const activePayables = payables.filter((payable) => payable.status !== enums_1.AccountingPayableStatus.CANCELLED &&
        payable.status !== enums_1.AccountingPayableStatus.DRAFT);
    const outstanding = activePayables.reduce((total, payable) => total + balanceOf(payable), 0);
    const dueThisWeek = activePayables.filter((payable) => payable.dueDate >= now && payable.dueDate <= endOfWeek);
    const dueThisMonth = activePayables.filter((payable) => payable.dueDate >= startOfMonth && payable.dueDate <= endOfMonth);
    const paidThisMonth = activePayables.filter((payable) => payable.status === enums_1.AccountingPayableStatus.PAID &&
        payable.billDate >= startOfMonth &&
        payable.billDate <= endOfMonth);
    const agingBuckets = [
        { label: '0 - 30 Days', min: 0, max: 30, color: '#8ccf3f' },
        { label: '31 - 60 Days', min: 31, max: 60, color: '#f7c948' },
        { label: '61 - 90 Days', min: 61, max: 90, color: '#fb923c' },
        { label: 'Over 90 Days', min: 91, max: Number.POSITIVE_INFINITY, color: '#f87171' },
    ].map((bucket) => {
        const value = activePayables.reduce((total, payable) => {
            const ageDays = Math.max(Math.floor((now.getTime() - payable.billDate.getTime()) / 86400000), 0);
            if (ageDays >= bucket.min && ageDays <= bucket.max) {
                return total + balanceOf(payable);
            }
            return total;
        }, 0);
        return {
            label: bucket.label,
            value,
            percent: outstanding ? Number(((value / outstanding) * 100).toFixed(1)) : 0,
            color: bucket.color,
        };
    });
    const categoryTotals = new Map();
    activePayables.forEach((payable) => {
        var _a;
        categoryTotals.set(payable.category, ((_a = categoryTotals.get(payable.category)) !== null && _a !== void 0 ? _a : 0) + balanceOf(payable));
    });
    const categoryBreakdown = Array.from(categoryTotals.entries()).map(([label, value]) => ({
        label,
        value,
        percent: outstanding ? Number(((value / outstanding) * 100).toFixed(1)) : 0,
    }));
    const trendMap = new Map();
    activePayables
        .filter((payable) => payable.billDate >= startOfMonth && payable.billDate <= endOfMonth)
        .forEach((payable) => {
        var _a;
        const label = formatMonthLabel(payable.billDate);
        trendMap.set(label, ((_a = trendMap.get(label)) !== null && _a !== void 0 ? _a : 0) + balanceOf(payable));
    });
    return {
        cards: {
            totalPayables: outstanding,
            dueThisWeek: dueThisWeek.reduce((total, payable) => total + balanceOf(payable), 0),
            dueThisWeekCount: dueThisWeek.length,
            dueThisMonth: dueThisMonth.reduce((total, payable) => total + balanceOf(payable), 0),
            dueThisMonthCount: dueThisMonth.length,
            paidThisMonth: paidThisMonth.reduce((total, payable) => total + toNumber(payable.paidAmount), 0),
            paidThisMonthCount: paidThisMonth.length,
        },
        aging: agingBuckets,
        categories: categoryBreakdown,
        trend: Array.from(trendMap.entries()).map(([label, value]) => ({ label, value })),
    };
});
const getAccountingPayables = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const query = req.query;
        const page = Math.max(Number.parseInt((_a = query.page) !== null && _a !== void 0 ? _a : '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt((_b = query.limit) !== null && _b !== void 0 ? _b : '10', 10), 1), 100);
        const skip = (page - 1) * limit;
        const search = (_c = query.search) === null || _c === void 0 ? void 0 : _c.trim();
        const where = Object.assign({ status: query.status, category: query.category ? { equals: query.category, mode: 'insensitive' } : undefined, supplier: query.supplier ? { equals: query.supplier, mode: 'insensitive' } : undefined }, (search
            ? {
                OR: [
                    { billNo: { contains: search, mode: 'insensitive' } },
                    { supplier: { contains: search, mode: 'insensitive' } },
                    { category: { contains: search, mode: 'insensitive' } },
                    { reference: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}));
        const [payables, total, summary] = yield Promise.all([
            prisma_1.prisma.accountingPayable.findMany({
                where,
                include: accounting_payable_shared_1.accountingPayableInclude,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.accountingPayable.count({ where }),
            buildPayableSummary(),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Accounts payable retrieved successfully',
            data: payables,
            summary,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting accounts payable', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAccountingPayables = getAccountingPayables;
const getAccountingPayableById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payable = yield prisma_1.prisma.accountingPayable.findUnique({
            where: { id: String(req.params.id) },
            include: accounting_payable_shared_1.accountingPayableInclude,
        });
        if (!payable) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Account payable not found',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Account payable retrieved successfully',
            data: payable,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting account payable', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAccountingPayableById = getAccountingPayableById;
const createAccountingPayable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const payable = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const billNo = yield (0, accounting_payable_shared_1.buildNextBillNo)(tx, new Date(body.billDate));
            return tx.accountingPayable.create({
                data: Object.assign(Object.assign({}, (0, accounting_payable_shared_1.buildAccountingPayableData)(body)), { billNo, items: {
                        create: (0, accounting_payable_shared_1.buildAccountingPayableItemsData)(body),
                    } }),
                include: accounting_payable_shared_1.accountingPayableInclude,
            });
        }));
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Account payable created successfully',
            data: payable,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating account payable', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createAccountingPayable = createAccountingPayable;
const updateAccountingPayable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const payableId = String(req.params.id);
        const exists = yield prisma_1.prisma.accountingPayable.findUnique({
            where: { id: payableId },
            select: { id: true },
        });
        if (!exists) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Account payable not found',
            });
            return;
        }
        const payable = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.accountingPayableItem.deleteMany({ where: { payableId } });
            return tx.accountingPayable.update({
                where: { id: payableId },
                data: Object.assign(Object.assign({}, (0, accounting_payable_shared_1.buildAccountingPayableData)(body)), { items: {
                        create: (0, accounting_payable_shared_1.buildAccountingPayableItemsData)(body),
                    } }),
                include: accounting_payable_shared_1.accountingPayableInclude,
            });
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Account payable updated successfully',
            data: payable,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating account payable', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateAccountingPayable = updateAccountingPayable;
const deleteAccountingPayable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payableId = String(req.params.id);
        const exists = yield prisma_1.prisma.accountingPayable.findUnique({
            where: { id: payableId },
            select: { id: true },
        });
        if (!exists) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Account payable not found',
            });
            return;
        }
        yield prisma_1.prisma.accountingPayable.delete({ where: { id: payableId } });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Account payable deleted successfully',
        });
    }
    catch (err) {
        winston_1.logger.error('Error while deleting account payable', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.deleteAccountingPayable = deleteAccountingPayable;
const updateAccountingPayableStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const payable = yield prisma_1.prisma.accountingPayable.update({
            where: { id: String(req.params.id) },
            data: { status: body.status },
            include: accounting_payable_shared_1.accountingPayableInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Account payable status updated successfully',
            data: payable,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating account payable status', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateAccountingPayableStatus = updateAccountingPayableStatus;
const recordAccountingPayablePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const existing = yield prisma_1.prisma.accountingPayable.findUnique({
            where: { id: String(req.params.id) },
        });
        if (!existing) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Account payable not found',
            });
            return;
        }
        const paidAmount = new client_1.Prisma.Decimal(existing.paidAmount)
            .plus(body.amount)
            .toDecimalPlaces(2);
        const payable = yield prisma_1.prisma.accountingPayable.update({
            where: { id: existing.id },
            data: {
                paidAmount,
                status: (0, accounting_payable_shared_1.resolvePayableStatus)({
                    dueDate: existing.dueDate,
                    paidAmount,
                    totalAmount: existing.totalAmount,
                }),
            },
            include: accounting_payable_shared_1.accountingPayableInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Payment recorded successfully',
            data: payable,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while recording account payable payment', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.recordAccountingPayablePayment = recordAccountingPayablePayment;
