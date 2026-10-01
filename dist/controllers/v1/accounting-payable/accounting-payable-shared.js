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
exports.buildNextBillNo = exports.buildAccountingPayableItemsData = exports.buildAccountingPayableData = exports.resolvePayableStatus = exports.calculateTotalAmount = exports.calculateItemAmount = exports.accountingPayableInclude = void 0;
const client_1 = require("@/generated/prisma/client");
const enums_1 = require("@/generated/prisma/enums");
exports.accountingPayableInclude = {
    items: {
        orderBy: { sortOrder: 'asc' },
    },
};
const toDecimal = (value) => new client_1.Prisma.Decimal(value !== null && value !== void 0 ? value : 0).toDecimalPlaces(2);
const trimToNull = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const parseDate = (value) => new Date(value);
const calculateItemAmount = (quantity, unitCost) => toDecimal(quantity).mul(toDecimal(unitCost)).toDecimalPlaces(2);
exports.calculateItemAmount = calculateItemAmount;
const calculateTotalAmount = (body) => {
    const subtotal = body.items.reduce((total, item) => total.add((0, exports.calculateItemAmount)(item.quantity, item.unitCost)), new client_1.Prisma.Decimal(0));
    return subtotal
        .minus(toDecimal(body.discount))
        .plus(toDecimal(body.tax))
        .toDecimalPlaces(2);
};
exports.calculateTotalAmount = calculateTotalAmount;
const resolvePayableStatus = ({ dueDate, paidAmount, requestedStatus, totalAmount, }) => {
    if (requestedStatus === enums_1.AccountingPayableStatus.DRAFT ||
        requestedStatus === enums_1.AccountingPayableStatus.CANCELLED) {
        return requestedStatus;
    }
    if (paidAmount.greaterThanOrEqualTo(totalAmount) && totalAmount.greaterThan(0)) {
        return enums_1.AccountingPayableStatus.PAID;
    }
    if (paidAmount.greaterThan(0)) {
        return enums_1.AccountingPayableStatus.PARTIAL;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalizedDueDate = new Date(dueDate);
    normalizedDueDate.setHours(0, 0, 0, 0);
    if (normalizedDueDate < today) {
        return enums_1.AccountingPayableStatus.OVERDUE;
    }
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    if (normalizedDueDate <= sevenDaysFromNow) {
        return enums_1.AccountingPayableStatus.DUE_SOON;
    }
    return enums_1.AccountingPayableStatus.OPEN;
};
exports.resolvePayableStatus = resolvePayableStatus;
const buildAccountingPayableData = (body) => {
    var _a;
    const totalAmount = (0, exports.calculateTotalAmount)(body);
    const paidAmount = toDecimal(body.paidAmount);
    const dueDate = parseDate(body.dueDate);
    return {
        supplier: body.supplier.trim(),
        category: body.category.trim(),
        billDate: parseDate(body.billDate),
        dueDate,
        reference: trimToNull(body.reference),
        description: trimToNull(body.description),
        paymentTerms: trimToNull(body.paymentTerms),
        paymentMethod: trimToNull(body.paymentMethod),
        bankAccount: trimToNull(body.bankAccount),
        remarks: trimToNull(body.remarks),
        discount: toDecimal(body.discount),
        tax: toDecimal(body.tax),
        totalAmount,
        paidAmount,
        status: (0, exports.resolvePayableStatus)({
            dueDate,
            paidAmount,
            requestedStatus: body.status,
            totalAmount,
        }),
        attachments: (_a = body.attachments) !== null && _a !== void 0 ? _a : [],
    };
};
exports.buildAccountingPayableData = buildAccountingPayableData;
const buildAccountingPayableItemsData = (body) => body.items.map((item, index) => ({
    description: item.description.trim(),
    category: trimToNull(item.category),
    quantity: toDecimal(item.quantity),
    unitCost: toDecimal(item.unitCost),
    amount: (0, exports.calculateItemAmount)(item.quantity, item.unitCost),
    sortOrder: index,
}));
exports.buildAccountingPayableItemsData = buildAccountingPayableItemsData;
const buildNextBillNo = (tx_1, ...args_1) => __awaiter(void 0, [tx_1, ...args_1], void 0, function* (tx, date = new Date()) {
    const yearSuffix = String(date.getFullYear()).slice(-2);
    const prefix = `BILL-${yearSuffix}-`;
    const latestPayable = yield tx.accountingPayable.findFirst({
        where: {
            billNo: {
                startsWith: prefix,
            },
        },
        orderBy: {
            billNo: 'desc',
        },
        select: {
            billNo: true,
        },
    });
    const latestSeries = (latestPayable === null || latestPayable === void 0 ? void 0 : latestPayable.billNo)
        ? Number.parseInt(latestPayable.billNo.slice(prefix.length), 10)
        : 0;
    const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
    return `${prefix}${String(nextSeries).padStart(4, '0')}`;
});
exports.buildNextBillNo = buildNextBillNo;
