import { Prisma } from '@/generated/prisma/client';
import { AccountingPayableStatus } from '@/generated/prisma/enums';

import type { AccountingPayableBody } from '@/validators/accounting-payable';

export const accountingPayableInclude = {
  items: {
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.AccountingPayableInclude;

const toDecimal = (value?: number | string | null) =>
  new Prisma.Decimal(value ?? 0).toDecimalPlaces(2);

const trimToNull = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const parseDate = (value: string) => new Date(value);

export const calculateItemAmount = (quantity: number, unitCost: number) =>
  toDecimal(quantity).mul(toDecimal(unitCost)).toDecimalPlaces(2);

export const calculateTotalAmount = (body: AccountingPayableBody) => {
  const subtotal = body.items.reduce(
    (total, item) => total.add(calculateItemAmount(item.quantity, item.unitCost)),
    new Prisma.Decimal(0),
  );

  return subtotal
    .minus(toDecimal(body.discount))
    .plus(toDecimal(body.tax))
    .toDecimalPlaces(2);
};

export const resolvePayableStatus = ({
  dueDate,
  paidAmount,
  requestedStatus,
  totalAmount,
}: {
  dueDate: Date;
  paidAmount: Prisma.Decimal;
  requestedStatus?: AccountingPayableStatus;
  totalAmount: Prisma.Decimal;
}) => {
  if (
    requestedStatus === AccountingPayableStatus.DRAFT ||
    requestedStatus === AccountingPayableStatus.CANCELLED
  ) {
    return requestedStatus;
  }

  if (paidAmount.greaterThanOrEqualTo(totalAmount) && totalAmount.greaterThan(0)) {
    return AccountingPayableStatus.PAID;
  }

  if (paidAmount.greaterThan(0)) {
    return AccountingPayableStatus.PARTIAL;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedDueDate = new Date(dueDate);
  normalizedDueDate.setHours(0, 0, 0, 0);

  if (normalizedDueDate < today) {
    return AccountingPayableStatus.OVERDUE;
  }

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  if (normalizedDueDate <= sevenDaysFromNow) {
    return AccountingPayableStatus.DUE_SOON;
  }

  return AccountingPayableStatus.OPEN;
};

export const buildAccountingPayableData = (body: AccountingPayableBody) => {
  const totalAmount = calculateTotalAmount(body);
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
    status: resolvePayableStatus({
      dueDate,
      paidAmount,
      requestedStatus: body.status,
      totalAmount,
    }),
    attachments: body.attachments ?? [],
  };
};

export const buildAccountingPayableItemsData = (body: AccountingPayableBody) =>
  body.items.map((item, index) => ({
    description: item.description.trim(),
    category: trimToNull(item.category),
    quantity: toDecimal(item.quantity),
    unitCost: toDecimal(item.unitCost),
    amount: calculateItemAmount(item.quantity, item.unitCost),
    sortOrder: index,
  }));

export const buildNextBillNo = async (
  tx: Prisma.TransactionClient,
  date = new Date(),
) => {
  const yearSuffix = String(date.getFullYear()).slice(-2);
  const prefix = `BILL-${yearSuffix}-`;
  const latestPayable = await tx.accountingPayable.findFirst({
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
  const latestSeries = latestPayable?.billNo
    ? Number.parseInt(latestPayable.billNo.slice(prefix.length), 10)
    : 0;
  const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;

  return `${prefix}${String(nextSeries).padStart(4, '0')}`;
};
