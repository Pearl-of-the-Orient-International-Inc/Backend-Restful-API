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
exports.getOwnerReport = exports.changeOwnerPin = exports.logoutOwner = exports.touchOwnerSession = exports.getOwnerSession = exports.loginOwner = void 0;
const http_codes_1 = require("@/common/http-codes");
const config_1 = __importDefault(require("@/config"));
const enums_1 = require("@/generated/prisma/enums");
const password_hash_1 = require("@/lib/password-hash");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const owner_access_1 = require("@/middlewares/owner-access");
const OWNER_CREDENTIAL_ID = 'owner';
const toNumber = (value) => Number(value !== null && value !== void 0 ? value : 0);
const onboardingStageConfig = [
    {
        step: enums_1.MemberOnboardingStep.PRE_ORIENTATION,
        label: 'Pre-orientation',
        fill: '#0ea5e9',
    },
    {
        step: enums_1.MemberOnboardingStep.PAYMENT_CHECKOUT,
        label: 'Payment checkout',
        fill: '#f59e0b',
    },
    {
        step: enums_1.MemberOnboardingStep.ONLINE_INTERVIEW,
        label: 'Online interview',
        fill: '#8b5cf6',
    },
    {
        step: enums_1.MemberOnboardingStep.ID_GENERATION,
        label: 'ID generation',
        fill: '#10b981',
    },
    {
        step: enums_1.MemberOnboardingStep.CHAPLAINCY_101,
        label: 'Chaplaincy training',
        fill: '#ef4444',
    },
];
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const defaultDateRange = () => {
    const now = new Date();
    return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: endOfDay(now),
    };
};
const startOfWeek = (date) => {
    const nextDate = startOfDay(date);
    const day = nextDate.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    nextDate.setDate(nextDate.getDate() + diff);
    return nextDate;
};
const endOfWeek = (date) => {
    const nextDate = startOfWeek(date);
    nextDate.setDate(nextDate.getDate() + 6);
    return endOfDay(nextDate);
};
const monthKey = (date) => date.toLocaleDateString('en-US', { month: 'short' });
const buildOwnerTrend = ({ members, events, now, }) => {
    const monthStarts = Array.from({ length: 6 }, (_, index) => {
        const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        return month;
    });
    return monthStarts.map((monthStart) => {
        const monthEnd = endOfDay(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0));
        return {
            month: monthKey(monthStart),
            applications: members.filter((member) => member.createdAt >= monthStart && member.createdAt <= monthEnd).length,
            approvals: members.filter((member) => member.isActive &&
                member.status === enums_1.MemberStatus.APPROVED &&
                member.updatedAt >= monthStart &&
                member.updatedAt <= monthEnd).length,
            events: events.filter((event) => event.startsAt >= monthStart && event.startsAt <= monthEnd).length,
        };
    });
};
const buildOwnerOnboardingBreakdown = (members) => {
    const activeMembers = members.filter((member) => member.isActive);
    const total = activeMembers.length;
    return onboardingStageConfig.map((stage) => {
        const value = activeMembers.filter((member) => { var _a; return ((_a = member.onboardingProgress) === null || _a === void 0 ? void 0 : _a.currentStep) === stage.step; }).length;
        return {
            label: stage.label,
            value,
            percentage: total ? Math.round((value / total) * 100) : 0,
            fill: stage.fill,
        };
    });
};
const buildCountBreakdown = ({ items, getKey, }) => {
    const countMap = new Map();
    items.forEach((item) => {
        var _a;
        const key = getKey(item);
        if (!key)
            return;
        countMap.set(key, ((_a = countMap.get(key)) !== null && _a !== void 0 ? _a : 0) + 1);
    });
    return Array.from(countMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((left, right) => right.value - left.value);
};
const buildCashflowTrend = (transactions) => {
    const trendMap = new Map();
    transactions.forEach((transaction) => {
        var _a;
        const label = transaction.transactionDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
        const existing = (_a = trendMap.get(label)) !== null && _a !== void 0 ? _a : {
            label,
            income: 0,
            expense: 0,
            net: 0,
        };
        existing.income += toNumber(transaction.debit);
        existing.expense += toNumber(transaction.credit);
        existing.net = existing.income - existing.expense;
        trendMap.set(label, existing);
    });
    return Array.from(trendMap.values());
};
const parseDateRange = (req) => {
    const fallback = defaultDateRange();
    const fromValue = typeof req.query.from === 'string' ? req.query.from : null;
    const toValue = typeof req.query.to === 'string' ? req.query.to : null;
    const from = fromValue ? startOfDay(new Date(fromValue)) : fallback.from;
    const to = toValue ? endOfDay(new Date(toValue)) : fallback.to;
    return Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())
        ? fallback
        : { from, to };
};
const ensureOwnerCredential = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const existing = yield prisma_1.prisma.ownerAccessCredential.findUnique({
        where: { id: OWNER_CREDENTIAL_ID },
    });
    if (existing)
        return existing;
    const defaultPin = (_a = config_1.default.OWNER_DEFAULT_PIN) === null || _a === void 0 ? void 0 : _a.trim();
    if (!defaultPin || !/^\d{6}$/.test(defaultPin)) {
        return null;
    }
    return prisma_1.prisma.ownerAccessCredential.create({
        data: {
            id: OWNER_CREDENTIAL_ID,
            pinHash: yield (0, password_hash_1.hashValue)(defaultPin),
        },
    });
});
const loginOwner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pin } = req.body;
        const credential = yield ensureOwnerCredential();
        if (!credential) {
            res.status(http_codes_1.HTTPSTATUS.SERVICE_UNAVAILABLE).json({
                code: 'OWNER_PIN_NOT_CONFIGURED',
                message: 'Owner PIN is not configured. Add OWNER_DEFAULT_PIN or create an owner PIN credential.',
            });
            return;
        }
        const isPinValid = yield (0, password_hash_1.compareValue)(pin, credential.pinHash);
        if (!isPinValid) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Invalid owner PIN.',
            });
            return;
        }
        yield prisma_1.prisma.ownerAccessCredential.update({
            where: { id: OWNER_CREDENTIAL_ID },
            data: { lastLoginAt: new Date() },
        });
        (0, owner_access_1.setOwnerSessionCookie)(res);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Owner access granted.',
            data: { authenticated: true, expiresInSeconds: 600 },
        });
    }
    catch (err) {
        winston_1.logger.error('Owner PIN login failed', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.loginOwner = loginOwner;
const getOwnerSession = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(http_codes_1.HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Owner session active.',
        data: { authenticated: true, expiresInSeconds: 600 },
    });
});
exports.getOwnerSession = getOwnerSession;
const touchOwnerSession = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, owner_access_1.setOwnerSessionCookie)(res);
    res.status(http_codes_1.HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Owner session refreshed.',
        data: { authenticated: true, expiresInSeconds: 600 },
    });
});
exports.touchOwnerSession = touchOwnerSession;
const logoutOwner = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, owner_access_1.clearOwnerSessionCookie)(res);
    res.status(http_codes_1.HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Owner session cleared.',
    });
});
exports.logoutOwner = logoutOwner;
const changeOwnerPin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPin, newPin } = req.body;
        const credential = yield ensureOwnerCredential();
        if (!credential) {
            res.status(http_codes_1.HTTPSTATUS.SERVICE_UNAVAILABLE).json({
                code: 'OWNER_PIN_NOT_CONFIGURED',
                message: 'Owner PIN is not configured.',
            });
            return;
        }
        const isPinValid = yield (0, password_hash_1.compareValue)(currentPin, credential.pinHash);
        if (!isPinValid) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Current owner PIN is invalid.',
            });
            return;
        }
        yield prisma_1.prisma.ownerAccessCredential.update({
            where: { id: OWNER_CREDENTIAL_ID },
            data: { pinHash: yield (0, password_hash_1.hashValue)(newPin) },
        });
        (0, owner_access_1.setOwnerSessionCookie)(res);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Owner PIN updated.',
        });
    }
    catch (err) {
        winston_1.logger.error('Owner PIN update failed', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.changeOwnerPin = changeOwnerPin;
const getOwnerReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { from, to } = parseDateRange(req);
        const dateWhere = { gte: from, lte: to };
        const now = new Date();
        const [totalMembers, approvedMembers, pendingMembers, newMembers, eventsInRange, upcomingEvents, newsBlogs, receipts, receivables, payables, ledgerTransactions, analyticsMembers, analyticsEvents,] = yield Promise.all([
            prisma_1.prisma.member.count({ where: { isActive: true } }),
            prisma_1.prisma.member.count({
                where: { isActive: true, status: enums_1.MemberStatus.APPROVED },
            }),
            prisma_1.prisma.member.count({
                where: { isActive: true, status: enums_1.MemberStatus.PENDING },
            }),
            prisma_1.prisma.member.count({ where: { isActive: true, createdAt: dateWhere } }),
            prisma_1.prisma.event.findMany({
                where: { startsAt: dateWhere },
                orderBy: { startsAt: 'asc' },
                select: {
                    id: true,
                    name: true,
                    startsAt: true,
                    location: true,
                    onlineLink: true,
                    status: true,
                    _count: { select: { attendees: true, taggedMembers: true } },
                },
            }),
            prisma_1.prisma.event.findMany({
                where: {
                    status: { not: enums_1.EventStatus.CANCELLED },
                    startsAt: { gte: now },
                },
                orderBy: { startsAt: 'asc' },
                take: 6,
                select: {
                    id: true,
                    name: true,
                    startsAt: true,
                    location: true,
                    onlineLink: true,
                    status: true,
                    _count: { select: { attendees: true, taggedMembers: true } },
                },
            }),
            prisma_1.prisma.newsBlog.findMany({
                where: { createdAt: dateWhere, isActive: true },
                orderBy: { createdAt: 'desc' },
                take: 6,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    createdAt: true,
                    publishedAt: true,
                },
            }),
            prisma_1.prisma.accountingAcknowledgementReceipt.findMany({
                where: { receiptDate: dateWhere },
                orderBy: { receiptDate: 'desc' },
                take: 8,
                select: {
                    id: true,
                    receiptNo: true,
                    name: true,
                    receiptDate: true,
                    totalAmount: true,
                },
            }),
            prisma_1.prisma.accountingReceivable.findMany({
                where: {
                    invoiceDate: dateWhere,
                    status: {
                        notIn: [
                            enums_1.AccountingReceivableStatus.DRAFT,
                            enums_1.AccountingReceivableStatus.CANCELLED,
                        ],
                    },
                },
                select: {
                    id: true,
                    invoiceNo: true,
                    customer: true,
                    invoiceDate: true,
                    dueDate: true,
                    totalAmount: true,
                    paidAmount: true,
                    status: true,
                },
            }),
            prisma_1.prisma.accountingPayable.findMany({
                where: {
                    billDate: dateWhere,
                    status: {
                        notIn: [
                            enums_1.AccountingPayableStatus.DRAFT,
                            enums_1.AccountingPayableStatus.CANCELLED,
                        ],
                    },
                },
                select: {
                    id: true,
                    billNo: true,
                    supplier: true,
                    billDate: true,
                    dueDate: true,
                    totalAmount: true,
                    paidAmount: true,
                    status: true,
                },
            }),
            prisma_1.prisma.accountingLedgerTransaction.findMany({
                where: {
                    transactionDate: dateWhere,
                    status: { not: enums_1.AccountingLedgerTransactionStatus.VOID },
                },
                orderBy: { transactionDate: 'desc' },
                take: 10,
                select: {
                    id: true,
                    transactionNo: true,
                    transactionDate: true,
                    type: true,
                    party: true,
                    category: true,
                    debit: true,
                    credit: true,
                    status: true,
                },
            }),
            prisma_1.prisma.member.findMany({
                select: {
                    status: true,
                    memberType: true,
                    isActive: true,
                    province: true,
                    region: true,
                    createdAt: true,
                    updatedAt: true,
                    onboardingProgress: {
                        select: {
                            currentStep: true,
                        },
                    },
                },
            }),
            prisma_1.prisma.event.findMany({
                select: {
                    startsAt: true,
                    category: true,
                    status: true,
                    type: true,
                },
            }),
        ]);
        const receiptTotal = receipts.reduce((sum, receipt) => sum + toNumber(receipt.totalAmount), 0);
        const receivableTotal = receivables.reduce((sum, item) => sum + toNumber(item.totalAmount), 0);
        const receivableCollected = receivables.reduce((sum, item) => sum + toNumber(item.paidAmount), 0);
        const payableTotal = payables.reduce((sum, item) => sum + toNumber(item.totalAmount), 0);
        const payablePaid = payables.reduce((sum, item) => sum + toNumber(item.paidAmount), 0);
        const ledgerDebit = ledgerTransactions.reduce((sum, item) => sum + toNumber(item.debit), 0);
        const ledgerCredit = ledgerTransactions.reduce((sum, item) => sum + toNumber(item.credit), 0);
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        const pendingAnalyticsMembers = analyticsMembers.filter((member) => member.isActive && member.status === enums_1.MemberStatus.PENDING);
        const thisWeeksEvents = analyticsEvents.filter((event) => event.status !== enums_1.EventStatus.CANCELLED &&
            event.startsAt >= weekStart &&
            event.startsAt <= weekEnd);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Owner report retrieved successfully',
            data: {
                range: {
                    from: from.toISOString(),
                    to: to.toISOString(),
                },
                summary: {
                    totalMembers,
                    approvedMembers,
                    pendingMembers,
                    urgentPendingApplications: pendingAnalyticsMembers.filter((member) => member.createdAt <= new Date(now.getTime() - 7 * 86400000)).length,
                    newMembers,
                    thisWeeksEvents: thisWeeksEvents.length,
                    onlineEventsThisWeek: thisWeeksEvents.filter((event) => event.type === enums_1.EventType.ONLINE).length,
                    eventsInRange: eventsInRange.length,
                    completedEvents: eventsInRange.filter((event) => event.status === enums_1.EventStatus.COMPLETED).length,
                    publishedPosts: newsBlogs.filter((post) => post.status === enums_1.NewsBlogStatus.PUBLISHED).length,
                    draftPosts: newsBlogs.filter((post) => post.status === enums_1.NewsBlogStatus.DRAFT).length,
                    receiptTotal,
                    receivableTotal,
                    receivableCollected,
                    receivableBalance: Math.max(receivableTotal - receivableCollected, 0),
                    payableTotal,
                    payablePaid,
                    payableBalance: Math.max(payableTotal - payablePaid, 0),
                    ledgerDebit,
                    ledgerCredit,
                    netCashflow: ledgerDebit - ledgerCredit,
                },
                membershipTrend: buildOwnerTrend({
                    members: analyticsMembers,
                    events: analyticsEvents,
                    now,
                }),
                onboardingBreakdown: buildOwnerOnboardingBreakdown(analyticsMembers),
                breakdowns: {
                    membersByStatus: buildCountBreakdown({
                        items: analyticsMembers.filter((member) => member.isActive),
                        getKey: (member) => member.status,
                    }),
                    membersByType: buildCountBreakdown({
                        items: analyticsMembers.filter((member) => member.isActive),
                        getKey: (member) => member.memberType,
                    }),
                    topMemberLocations: buildCountBreakdown({
                        items: analyticsMembers.filter((member) => member.isActive),
                        getKey: (member) => { var _a, _b; return (_b = (_a = member.province) !== null && _a !== void 0 ? _a : member.region) !== null && _b !== void 0 ? _b : 'Unknown'; },
                    }).slice(0, 8),
                    eventsByStatus: buildCountBreakdown({
                        items: analyticsEvents,
                        getKey: (event) => event.status,
                    }),
                    eventsByCategory: buildCountBreakdown({
                        items: analyticsEvents,
                        getKey: (event) => event.category,
                    }),
                    newsByStatus: buildCountBreakdown({
                        items: newsBlogs,
                        getKey: (post) => post.status,
                    }),
                },
                cashflowTrend: buildCashflowTrend(ledgerTransactions),
                events: {
                    inRange: eventsInRange.map((event) => {
                        var _a, _b;
                        return (Object.assign(Object.assign({}, event), { startsAt: event.startsAt.toISOString(), attendeeCount: Math.max(event._count.attendees, event._count.taggedMembers), location: (_b = (_a = event.location) !== null && _a !== void 0 ? _a : event.onlineLink) !== null && _b !== void 0 ? _b : 'TBA' }));
                    }),
                    upcoming: upcomingEvents.map((event) => {
                        var _a, _b;
                        return (Object.assign(Object.assign({}, event), { startsAt: event.startsAt.toISOString(), attendeeCount: Math.max(event._count.attendees, event._count.taggedMembers), location: (_b = (_a = event.location) !== null && _a !== void 0 ? _a : event.onlineLink) !== null && _b !== void 0 ? _b : 'TBA' }));
                    }),
                },
                newsBlogs: newsBlogs.map((post) => {
                    var _a, _b;
                    return (Object.assign(Object.assign({}, post), { createdAt: post.createdAt.toISOString(), publishedAt: (_b = (_a = post.publishedAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null }));
                }),
                accounting: {
                    receipts: receipts.map((receipt) => (Object.assign(Object.assign({}, receipt), { receiptDate: receipt.receiptDate.toISOString(), totalAmount: toNumber(receipt.totalAmount) }))),
                    receivables: receivables.slice(0, 8).map((item) => (Object.assign(Object.assign({}, item), { invoiceDate: item.invoiceDate.toISOString(), dueDate: item.dueDate.toISOString(), totalAmount: toNumber(item.totalAmount), paidAmount: toNumber(item.paidAmount), balance: Math.max(toNumber(item.totalAmount) - toNumber(item.paidAmount), 0) }))),
                    payables: payables.slice(0, 8).map((item) => (Object.assign(Object.assign({}, item), { billDate: item.billDate.toISOString(), dueDate: item.dueDate.toISOString(), totalAmount: toNumber(item.totalAmount), paidAmount: toNumber(item.paidAmount), balance: Math.max(toNumber(item.totalAmount) - toNumber(item.paidAmount), 0) }))),
                    ledgerTransactions: ledgerTransactions.map((item) => (Object.assign(Object.assign({}, item), { transactionDate: item.transactionDate.toISOString(), debit: toNumber(item.debit), credit: toNumber(item.credit) }))),
                },
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Owner report retrieval failed', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getOwnerReport = getOwnerReport;
