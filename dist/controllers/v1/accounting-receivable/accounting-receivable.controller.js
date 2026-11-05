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
exports.recordAccountingReceivablePayment = exports.updateAccountingReceivableStatus = exports.deleteAccountingReceivable = exports.updateAccountingReceivable = exports.createAccountingReceivable = exports.getAccountingReceivableById = exports.getAccountingReceivables = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const accounting_receivable_shared_1 = require("./accounting-receivable-shared");
const toNumber = (value) => Number(value !== null && value !== void 0 ? value : 0);
const balanceOf = ({ paidAmount, totalAmount }) => Math.max(toNumber(totalAmount) - toNumber(paidAmount), 0);
const formatMonthLabel = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const buildReceivableSummary = () => __awaiter(void 0, void 0, void 0, function* () {
    const receivables = yield prisma_1.prisma.accountingReceivable.findMany({
        select: { customer: true, dueDate: true, invoiceDate: true, paidAmount: true, status: true, totalAmount: true },
    });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const active = receivables.filter((item) => item.status !== enums_1.AccountingReceivableStatus.CANCELLED && item.status !== enums_1.AccountingReceivableStatus.DRAFT);
    const outstanding = active.reduce((total, item) => total + balanceOf(item), 0);
    const collectedThisMonth = active.filter((item) => item.paidAmount.greaterThan(0) && item.invoiceDate >= startOfMonth && item.invoiceDate <= endOfMonth);
    const overdue = active.filter((item) => item.status === enums_1.AccountingReceivableStatus.OVERDUE);
    const aging = [
        { label: '0 - 30 Days', min: 0, max: 30, color: '#8ccf3f' },
        { label: '31 - 60 Days', min: 31, max: 60, color: '#f7c948' },
        { label: '61 - 90 Days', min: 61, max: 90, color: '#fb923c' },
        { label: 'Over 90 Days', min: 91, max: Number.POSITIVE_INFINITY, color: '#f87171' },
    ].map((bucket) => {
        const value = active.reduce((total, item) => {
            const ageDays = Math.max(Math.floor((now.getTime() - item.invoiceDate.getTime()) / 86400000), 0);
            return ageDays >= bucket.min && ageDays <= bucket.max ? total + balanceOf(item) : total;
        }, 0);
        return { label: bucket.label, value, percent: outstanding ? Number(((value / outstanding) * 100).toFixed(1)) : 0, color: bucket.color };
    });
    const customerTotals = new Map();
    active.forEach((item) => { var _a; return customerTotals.set(item.customer, ((_a = customerTotals.get(item.customer)) !== null && _a !== void 0 ? _a : 0) + balanceOf(item)); });
    const topCustomers = Array.from(customerTotals.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((left, right) => right.amount - left.amount)
        .slice(0, 5);
    const trendMap = new Map();
    active
        .filter((item) => item.invoiceDate >= startOfMonth && item.invoiceDate <= endOfMonth)
        .forEach((item) => {
        var _a;
        const label = formatMonthLabel(item.invoiceDate);
        trendMap.set(label, ((_a = trendMap.get(label)) !== null && _a !== void 0 ? _a : 0) + balanceOf(item));
    });
    return {
        cards: {
            totalReceivables: outstanding,
            overdue: overdue.reduce((total, item) => total + balanceOf(item), 0),
            overdueCount: overdue.length,
            collectedThisMonth: collectedThisMonth.reduce((total, item) => total + toNumber(item.paidAmount), 0),
            collectedThisMonthCount: collectedThisMonth.length,
            invoices: active.length,
        },
        aging,
        topCustomers,
        trend: Array.from(trendMap.entries()).map(([label, value]) => ({ label, value })),
    };
});
const getAccountingReceivables = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const query = req.query;
        const page = Math.max(Number.parseInt((_a = query.page) !== null && _a !== void 0 ? _a : '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt((_b = query.limit) !== null && _b !== void 0 ? _b : '10', 10), 1), 100);
        const skip = (page - 1) * limit;
        const search = (_c = query.search) === null || _c === void 0 ? void 0 : _c.trim();
        const where = Object.assign({ status: query.status, customer: query.customer ? { equals: query.customer, mode: 'insensitive' } : undefined }, (search
            ? {
                OR: [
                    { invoiceNo: { contains: search, mode: 'insensitive' } },
                    { customer: { contains: search, mode: 'insensitive' } },
                    { reference: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}));
        const [receivables, total, summary] = yield Promise.all([
            prisma_1.prisma.accountingReceivable.findMany({ where, include: accounting_receivable_shared_1.accountingReceivableInclude, orderBy: { createdAt: 'desc' }, skip, take: limit }),
            prisma_1.prisma.accountingReceivable.count({ where }),
            buildReceivableSummary(),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Accounts receivable retrieved successfully',
            data: receivables,
            summary,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting accounts receivable', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getAccountingReceivables = getAccountingReceivables;
const getAccountingReceivableById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const receivable = yield prisma_1.prisma.accountingReceivable.findUnique({
            where: { id: String(req.params.id) },
            include: accounting_receivable_shared_1.accountingReceivableInclude,
        });
        if (!receivable) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Account receivable not found' });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Account receivable retrieved successfully', data: receivable });
    }
    catch (err) {
        winston_1.logger.error('Error while getting account receivable', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.getAccountingReceivableById = getAccountingReceivableById;
const createAccountingReceivable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const receivable = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const invoiceNo = yield (0, accounting_receivable_shared_1.buildNextInvoiceNo)(tx, new Date(body.invoiceDate));
            return tx.accountingReceivable.create({
                data: Object.assign(Object.assign({}, (0, accounting_receivable_shared_1.buildAccountingReceivableData)(body)), { invoiceNo, items: { create: (0, accounting_receivable_shared_1.buildAccountingReceivableItemsData)(body) } }),
                include: accounting_receivable_shared_1.accountingReceivableInclude,
            });
        }));
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Account receivable created successfully', data: receivable });
    }
    catch (err) {
        winston_1.logger.error('Error while creating account receivable', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.createAccountingReceivable = createAccountingReceivable;
const updateAccountingReceivable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const receivableId = String(req.params.id);
        const exists = yield prisma_1.prisma.accountingReceivable.findUnique({ where: { id: receivableId }, select: { id: true } });
        if (!exists) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Account receivable not found' });
            return;
        }
        const receivable = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.accountingReceivableItem.deleteMany({ where: { receivableId } });
            return tx.accountingReceivable.update({
                where: { id: receivableId },
                data: Object.assign(Object.assign({}, (0, accounting_receivable_shared_1.buildAccountingReceivableData)(body)), { items: { create: (0, accounting_receivable_shared_1.buildAccountingReceivableItemsData)(body) } }),
                include: accounting_receivable_shared_1.accountingReceivableInclude,
            });
        }));
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Account receivable updated successfully', data: receivable });
    }
    catch (err) {
        winston_1.logger.error('Error while updating account receivable', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.updateAccountingReceivable = updateAccountingReceivable;
const deleteAccountingReceivable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = String(req.params.id);
        const exists = yield prisma_1.prisma.accountingReceivable.findUnique({ where: { id }, select: { id: true } });
        if (!exists) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Account receivable not found' });
            return;
        }
        yield prisma_1.prisma.accountingReceivable.delete({ where: { id } });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Account receivable deleted successfully' });
    }
    catch (err) {
        winston_1.logger.error('Error while deleting account receivable', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.deleteAccountingReceivable = deleteAccountingReceivable;
const updateAccountingReceivableStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const receivable = yield prisma_1.prisma.accountingReceivable.update({
            where: { id: String(req.params.id) },
            data: { status: body.status },
            include: accounting_receivable_shared_1.accountingReceivableInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Account receivable status updated successfully', data: receivable });
    }
    catch (err) {
        winston_1.logger.error('Error while updating account receivable status', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.updateAccountingReceivableStatus = updateAccountingReceivableStatus;
const recordAccountingReceivablePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const existing = yield prisma_1.prisma.accountingReceivable.findUnique({ where: { id: String(req.params.id) } });
        if (!existing) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Account receivable not found' });
            return;
        }
        const paidAmount = new client_1.Prisma.Decimal(existing.paidAmount).plus(body.amount).toDecimalPlaces(2);
        const receivable = yield prisma_1.prisma.accountingReceivable.update({
            where: { id: existing.id },
            data: {
                paidAmount,
                status: (0, accounting_receivable_shared_1.resolveReceivableStatus)({ dueDate: existing.dueDate, paidAmount, totalAmount: existing.totalAmount }),
            },
            include: accounting_receivable_shared_1.accountingReceivableInclude,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Payment recorded successfully', data: receivable });
    }
    catch (err) {
        winston_1.logger.error('Error while recording account receivable payment', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
    }
});
exports.recordAccountingReceivablePayment = recordAccountingReceivablePayment;
