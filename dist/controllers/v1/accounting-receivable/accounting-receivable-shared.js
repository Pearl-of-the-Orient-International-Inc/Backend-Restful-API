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
exports.buildNextInvoiceNo = exports.buildAccountingReceivableItemsData = exports.buildAccountingReceivableData = exports.resolveReceivableStatus = exports.calculateReceivableTotalAmount = exports.calculateReceivableItemAmount = exports.accountingReceivableInclude = void 0;
const client_1 = require("../../../generated/prisma/client");
const enums_1 = require("../../../generated/prisma/enums");
exports.accountingReceivableInclude = {
    items: { orderBy: { sortOrder: 'asc' } },
};
const toDecimal = (value) => new client_1.Prisma.Decimal(value !== null && value !== void 0 ? value : 0).toDecimalPlaces(2);
const trimToNull = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const parseDate = (value) => new Date(value);
const calculateReceivableItemAmount = (quantity, unitPrice) => toDecimal(quantity).mul(toDecimal(unitPrice)).toDecimalPlaces(2);
exports.calculateReceivableItemAmount = calculateReceivableItemAmount;
const calculateReceivableTotalAmount = (body) => body.items
    .reduce((total, item) => total.add((0, exports.calculateReceivableItemAmount)(item.quantity, item.unitPrice)), new client_1.Prisma.Decimal(0))
    .minus(toDecimal(body.discount))
    .plus(toDecimal(body.tax))
    .toDecimalPlaces(2);
exports.calculateReceivableTotalAmount = calculateReceivableTotalAmount;
const resolveReceivableStatus = ({ dueDate, paidAmount, requestedStatus, totalAmount, }) => {
    if (requestedStatus === enums_1.AccountingReceivableStatus.DRAFT ||
        requestedStatus === enums_1.AccountingReceivableStatus.CANCELLED) {
        return requestedStatus;
    }
    if (paidAmount.greaterThanOrEqualTo(totalAmount) && totalAmount.greaterThan(0)) {
        return enums_1.AccountingReceivableStatus.PAID;
    }
    if (paidAmount.greaterThan(0))
        return enums_1.AccountingReceivableStatus.PARTIAL;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalizedDueDate = new Date(dueDate);
    normalizedDueDate.setHours(0, 0, 0, 0);
    return normalizedDueDate < today
        ? enums_1.AccountingReceivableStatus.OVERDUE
        : enums_1.AccountingReceivableStatus.UNPAID;
};
exports.resolveReceivableStatus = resolveReceivableStatus;
const buildAccountingReceivableData = (body) => {
    var _a;
    const totalAmount = (0, exports.calculateReceivableTotalAmount)(body);
    const paidAmount = toDecimal(body.paidAmount);
    const dueDate = parseDate(body.dueDate);
    return {
        customer: body.customer.trim(),
        invoiceDate: parseDate(body.invoiceDate),
        dueDate,
        reference: trimToNull(body.reference),
        description: trimToNull(body.description),
        paymentTerms: trimToNull(body.paymentTerms),
        paymentMethod: trimToNull(body.paymentMethod),
        bankAccount: trimToNull(body.bankAccount),
        notes: trimToNull(body.notes),
        discount: toDecimal(body.discount),
        tax: toDecimal(body.tax),
        totalAmount,
        paidAmount,
        status: (0, exports.resolveReceivableStatus)({ dueDate, paidAmount, requestedStatus: body.status, totalAmount }),
        attachments: (_a = body.attachments) !== null && _a !== void 0 ? _a : [],
    };
};
exports.buildAccountingReceivableData = buildAccountingReceivableData;
const buildAccountingReceivableItemsData = (body) => body.items.map((item, index) => ({
    description: item.description.trim(),
    account: trimToNull(item.account),
    quantity: toDecimal(item.quantity),
    unitPrice: toDecimal(item.unitPrice),
    amount: (0, exports.calculateReceivableItemAmount)(item.quantity, item.unitPrice),
    sortOrder: index,
}));
exports.buildAccountingReceivableItemsData = buildAccountingReceivableItemsData;
const buildNextInvoiceNo = (tx_1, ...args_1) => __awaiter(void 0, [tx_1, ...args_1], void 0, function* (tx, date = new Date()) {
    const yearSuffix = String(date.getFullYear()).slice(-2);
    const prefix = `INV-${yearSuffix}-`;
    const latestReceivable = yield tx.accountingReceivable.findFirst({
        where: { invoiceNo: { startsWith: prefix } },
        orderBy: { invoiceNo: 'desc' },
        select: { invoiceNo: true },
    });
    const latestSeries = (latestReceivable === null || latestReceivable === void 0 ? void 0 : latestReceivable.invoiceNo)
        ? Number.parseInt(latestReceivable.invoiceNo.slice(prefix.length), 10)
        : 0;
    const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
    return `${prefix}${String(nextSeries).padStart(4, '0')}`;
});
exports.buildNextInvoiceNo = buildNextInvoiceNo;
