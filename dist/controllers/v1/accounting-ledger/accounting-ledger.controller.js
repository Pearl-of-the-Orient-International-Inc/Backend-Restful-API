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
exports.deleteAccountingLedgerTransaction = exports.updateAccountingLedgerTransaction = exports.createAccountingLedgerTransaction = exports.getAccountingLedgerTransactions = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const toDecimal = (value) => new client_1.Prisma.Decimal(value !== null && value !== void 0 ? value : 0).toDecimalPlaces(2);
const toNumber = (value) => Number(value !== null && value !== void 0 ? value : 0);
const trimToNull = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const formatMonthLabel = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const buildNextTransactionNo = (tx_1, ...args_1) => __awaiter(void 0, [tx_1, ...args_1], void 0, function* (tx, date = new Date()) {
    const prefix = `LED-${String(date.getFullYear()).slice(-2)}-`;
    const latest = yield tx.accountingLedgerTransaction.findFirst({
        where: { transactionNo: { startsWith: prefix } },
        orderBy: { transactionNo: 'desc' },
        select: { transactionNo: true },
    });
    const latestSeries = (latest === null || latest === void 0 ? void 0 : latest.transactionNo)
        ? Number.parseInt(latest.transactionNo.slice(prefix.length), 10)
        : 0;
    const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
    return `${prefix}${String(nextSeries).padStart(4, '0')}`;
});
const buildLedgerSummary = () => __awaiter(void 0, void 0, void 0, function* () {
    const [transactions, receivables, payables] = yield Promise.all([
        prisma_1.prisma.accountingLedgerTransaction.findMany(),
        prisma_1.prisma.accountingReceivable.findMany({
            select: { invoiceDate: true, paidAmount: true, status: true, totalAmount: true },
        }),
        prisma_1.prisma.accountingPayable.findMany({
            select: { billDate: true, paidAmount: true, status: true, totalAmount: true },
        }),
    ]);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const currentMonthTransactions = transactions.filter((item) => item.transactionDate >= startOfMonth && item.transactionDate <= endOfMonth);
    const revenue = currentMonthTransactions.reduce((total, item) => total + toNumber(item.credit), 0);
    const expenses = currentMonthTransactions.reduce((total, item) => total + toNumber(item.debit), 0);
    const cashBalance = transactions.reduce((total, item) => total + toNumber(item.credit) - toNumber(item.debit), 0);
    const trendMap = new Map();
    currentMonthTransactions.forEach((item) => {
        var _a;
        const label = formatMonthLabel(item.transactionDate);
        const current = (_a = trendMap.get(label)) !== null && _a !== void 0 ? _a : { expenses: 0, revenue: 0 };
        trendMap.set(label, {
            expenses: current.expenses + toNumber(item.debit),
            revenue: current.revenue + toNumber(item.credit),
        });
    });
    const agingBuckets = [
        { label: '0 - 30 Days', min: 0, max: 30, color: '#8ccf3f' },
        { label: '31 - 60 Days', min: 31, max: 60, color: '#f7c948' },
        { label: '61 - 90 Days', min: 61, max: 90, color: '#fb923c' },
        { label: 'Over 90 Days', min: 91, max: Number.POSITIVE_INFINITY, color: '#f87171' },
    ];
    const buildAging = (rows) => {
        const total = rows.reduce((sum, row) => sum + Math.max(toNumber(row.totalAmount) - toNumber(row.paidAmount), 0), 0);
        return {
            total,
            segments: agingBuckets.map((bucket) => {
                const value = rows.reduce((sum, row) => {
                    const ageDays = Math.max(Math.floor((now.getTime() - row.date.getTime()) / 86400000), 0);
                    const balance = Math.max(toNumber(row.totalAmount) - toNumber(row.paidAmount), 0);
                    return ageDays >= bucket.min && ageDays <= bucket.max ? sum + balance : sum;
                }, 0);
                return {
                    label: bucket.label,
                    value,
                    percent: total ? Number(((value / total) * 100).toFixed(1)) : 0,
                    color: bucket.color,
                };
            }),
        };
    };
    return {
        cards: {
            cashBalance,
            revenue,
            expenses,
            netCashflow: revenue - expenses,
        },
        trend: Array.from(trendMap.entries()).map(([label, value]) => (Object.assign({ label }, value))),
        receivableAging: buildAging(receivables.map((item) => (Object.assign(Object.assign({}, item), { date: item.invoiceDate })))),
        payableAging: buildAging(payables.map((item) => (Object.assign(Object.assign({}, item), { date: item.billDate })))),
    };
});
const getAccountingLedgerTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const query = req.query;
        const page = Math.max(Number.parseInt((_a = query.page) !== null && _a !== void 0 ? _a : '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt((_b = query.limit) !== null && _b !== void 0 ? _b : '10', 10), 1), 100);
        const skip = (page - 1) * limit;
        const search = (_c = query.search) === null || _c === void 0 ? void 0 : _c.trim();
        const where = Object.assign({ account: query.account ? { equals: query.account, mode: 'insensitive' } : undefined, status: query.status, type: query.type }, (search
            ? {
                OR: [
                    { transactionNo: { contains: search, mode: 'insensitive' } },
                    { reference: { contains: search, mode: 'insensitive' } },
                    { party: { contains: search, mode: 'insensitive' } },
                    { note: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}));
        const [transactions, total, summary] = yield Promise.all([
            prisma_1.prisma.accountingLedgerTransaction.findMany({
                where,
                orderBy: { transactionDate: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.accountingLedgerTransaction.count({ where }),
            buildLedgerSummary(),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Cashflow ledger retrieved successfully',
            data: transactions,
            summary,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting cashflow ledger', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAccountingLedgerTransactions = getAccountingLedgerTransactions;
const createAccountingLedgerTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const transaction = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const transactionDate = new Date(body.transactionDate);
            const transactionNo = yield buildNextTransactionNo(tx, transactionDate);
            return tx.accountingLedgerTransaction.create({
                data: {
                    transactionNo,
                    transactionDate,
                    type: body.type,
                    party: body.party.trim(),
                    note: trimToNull(body.note),
                    account: body.account.trim(),
                    accountNo: trimToNull(body.accountNo),
                    category: body.category.trim(),
                    debit: toDecimal(body.debit),
                    credit: toDecimal(body.credit),
                    status: body.status,
                    reference: trimToNull(body.reference),
                },
            });
        }));
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Cashflow transaction created successfully',
            data: transaction,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating cashflow transaction', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createAccountingLedgerTransaction = createAccountingLedgerTransaction;
const updateAccountingLedgerTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const transaction = yield prisma_1.prisma.accountingLedgerTransaction.update({
            where: { id: String(req.params.id) },
            data: {
                transactionDate: new Date(body.transactionDate),
                type: body.type,
                party: body.party.trim(),
                note: trimToNull(body.note),
                account: body.account.trim(),
                accountNo: trimToNull(body.accountNo),
                category: body.category.trim(),
                debit: toDecimal(body.debit),
                credit: toDecimal(body.credit),
                status: body.status,
                reference: trimToNull(body.reference),
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Cashflow transaction updated successfully',
            data: transaction,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Cashflow transaction not found',
            });
            return;
        }
        winston_1.logger.error('Error while updating cashflow transaction', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateAccountingLedgerTransaction = updateAccountingLedgerTransaction;
const deleteAccountingLedgerTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.accountingLedgerTransaction.delete({
            where: { id: String(req.params.id) },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Cashflow transaction deleted successfully',
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Cashflow transaction not found',
            });
            return;
        }
        winston_1.logger.error('Error while deleting cashflow transaction', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.deleteAccountingLedgerTransaction = deleteAccountingLedgerTransaction;
