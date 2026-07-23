import { Prisma } from '@/generated/prisma/client';
import { AccountingReceivableStatus } from '@/generated/prisma/enums';
import type { AccountingReceivableBody } from '@/validators/accounting-receivable';

export const accountingReceivableInclude = {
  items: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.AccountingReceivableInclude;

const toDecimal = (value?: number | string | null) =>
  new Prisma.Decimal(value ?? 0).toDecimalPlaces(2);
const trimToNull = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};
const parseDate = (value: string) => new Date(value);

export const calculateReceivableItemAmount = (quantity: number, unitPrice: number) =>
  toDecimal(quantity).mul(toDecimal(unitPrice)).toDecimalPlaces(2);

export const calculateReceivableTotalAmount = (body: AccountingReceivableBody) =>
  body.items
    .reduce(
      (total, item) => total.add(calculateReceivableItemAmount(item.quantity, item.unitPrice)),
      new Prisma.Decimal(0),
    )
    .minus(toDecimal(body.discount))
    .plus(toDecimal(body.tax))
    .toDecimalPlaces(2);

export const resolveReceivableStatus = ({
  dueDate,
  paidAmount,
  requestedStatus,
  totalAmount,
}: {
  dueDate: Date;
  paidAmount: Prisma.Decimal;
  requestedStatus?: AccountingReceivableStatus;
  totalAmount: Prisma.Decimal;
}) => {
  if (
    requestedStatus === AccountingReceivableStatus.DRAFT ||
    requestedStatus === AccountingReceivableStatus.CANCELLED
  ) {
    return requestedStatus;
  }
  if (paidAmount.greaterThanOrEqualTo(totalAmount) && totalAmount.greaterThan(0)) {
    return AccountingReceivableStatus.PAID;
  }
  if (paidAmount.greaterThan(0)) return AccountingReceivableStatus.PARTIAL;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedDueDate = new Date(dueDate);
  normalizedDueDate.setHours(0, 0, 0, 0);
  return normalizedDueDate < today
    ? AccountingReceivableStatus.OVERDUE
    : AccountingReceivableStatus.UNPAID;
};

export const buildAccountingReceivableData = (body: AccountingReceivableBody) => {
  const totalAmount = calculateReceivableTotalAmount(body);
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
    status: resolveReceivableStatus({ dueDate, paidAmount, requestedStatus: body.status, totalAmount }),
    attachments: body.attachments ?? [],
  };
};

export const buildAccountingReceivableItemsData = (body: AccountingReceivableBody) =>
  body.items.map((item, index) => ({
    description: item.description.trim(),
    account: trimToNull(item.account),
    quantity: toDecimal(item.quantity),
    unitPrice: toDecimal(item.unitPrice),
    amount: calculateReceivableItemAmount(item.quantity, item.unitPrice),
    sortOrder: index,
  }));

export const buildNextInvoiceNo = async (
  tx: Prisma.TransactionClient,
  date = new Date(),
) => {
  const yearSuffix = String(date.getFullYear()).slice(-2);
  const prefix = `INV-${yearSuffix}-`;
  const latestReceivable = await tx.accountingReceivable.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
    select: { invoiceNo: true },
  });
  const latestSeries = latestReceivable?.invoiceNo
    ? Number.parseInt(latestReceivable.invoiceNo.slice(prefix.length), 10)
    : 0;
  const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
  return `${prefix}${String(nextSeries).padStart(4, '0')}`;
};
