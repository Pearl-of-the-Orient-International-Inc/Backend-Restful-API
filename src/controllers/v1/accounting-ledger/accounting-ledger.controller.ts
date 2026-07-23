import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import {
  AccountingLedgerTransactionStatus,
  AccountingLedgerTransactionType,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { Request, Response } from 'express';
import type {
  CreateAccountingLedgerTransactionBody,
  GetAccountingLedgerTransactionsQuery,
  UpdateAccountingLedgerTransactionBody,
} from '@/validators/accounting-ledger';

const toDecimal = (value?: number | string | null) =>
  new Prisma.Decimal(value ?? 0).toDecimalPlaces(2);
const toNumber = (value: Prisma.Decimal | number | string | null | undefined) =>
  Number(value ?? 0);
const trimToNull = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};
const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const buildNextTransactionNo = async (
  tx: Prisma.TransactionClient,
  date = new Date(),
) => {
  const prefix = `LED-${String(date.getFullYear()).slice(-2)}-`;
  const latest = await tx.accountingLedgerTransaction.findFirst({
    where: { transactionNo: { startsWith: prefix } },
    orderBy: { transactionNo: 'desc' },
    select: { transactionNo: true },
  });
  const latestSeries = latest?.transactionNo
    ? Number.parseInt(latest.transactionNo.slice(prefix.length), 10)
    : 0;
  const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
  return `${prefix}${String(nextSeries).padStart(4, '0')}`;
};

const buildLedgerSummary = async () => {
  const [transactions, receivables, payables] = await Promise.all([
    prisma.accountingLedgerTransaction.findMany(),
    prisma.accountingReceivable.findMany({
      select: { invoiceDate: true, paidAmount: true, status: true, totalAmount: true },
    }),
    prisma.accountingPayable.findMany({
      select: { billDate: true, paidAmount: true, status: true, totalAmount: true },
    }),
  ]);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const currentMonthTransactions = transactions.filter(
    (item) => item.transactionDate >= startOfMonth && item.transactionDate <= endOfMonth,
  );
  const revenue = currentMonthTransactions.reduce(
    (total, item) => total + toNumber(item.credit),
    0,
  );
  const expenses = currentMonthTransactions.reduce(
    (total, item) => total + toNumber(item.debit),
    0,
  );
  const cashBalance = transactions.reduce(
    (total, item) => total + toNumber(item.credit) - toNumber(item.debit),
    0,
  );
  const trendMap = new Map<string, { expenses: number; revenue: number }>();
  currentMonthTransactions.forEach((item) => {
    const label = formatMonthLabel(item.transactionDate);
    const current = trendMap.get(label) ?? { expenses: 0, revenue: 0 };
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
  const buildAging = <T extends { paidAmount: Prisma.Decimal; totalAmount: Prisma.Decimal }>(
    rows: (T & { date: Date })[],
  ) => {
    const total = rows.reduce(
      (sum, row) => sum + Math.max(toNumber(row.totalAmount) - toNumber(row.paidAmount), 0),
      0,
    );
    return {
      total,
      segments: agingBuckets.map((bucket) => {
        const value = rows.reduce((sum, row) => {
          const ageDays = Math.max(Math.floor((now.getTime() - row.date.getTime()) / 86_400_000), 0);
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
    trend: Array.from(trendMap.entries()).map(([label, value]) => ({ label, ...value })),
    receivableAging: buildAging(receivables.map((item) => ({ ...item, date: item.invoiceDate }))),
    payableAging: buildAging(payables.map((item) => ({ ...item, date: item.billDate }))),
  };
};

export const getAccountingLedgerTransactions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAccountingLedgerTransactionsQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10), 1), 100);
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const where: Prisma.AccountingLedgerTransactionWhereInput = {
      account: query.account ? { equals: query.account, mode: 'insensitive' } : undefined,
      status: query.status,
      type: query.type,
      ...(search
        ? {
            OR: [
              { transactionNo: { contains: search, mode: 'insensitive' } },
              { reference: { contains: search, mode: 'insensitive' } },
              { party: { contains: search, mode: 'insensitive' } },
              { note: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [transactions, total, summary] = await Promise.all([
      prisma.accountingLedgerTransaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.accountingLedgerTransaction.count({ where }),
      buildLedgerSummary(),
    ]);
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Cashflow ledger retrieved successfully',
      data: transactions,
      summary,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error('Error while getting cashflow ledger', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const createAccountingLedgerTransaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateAccountingLedgerTransactionBody;
    const transaction = await prisma.$transaction(async (tx) => {
      const transactionDate = new Date(body.transactionDate);
      const transactionNo = await buildNextTransactionNo(tx, transactionDate);
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
    });
    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Cashflow transaction created successfully',
      data: transaction,
    });
  } catch (err) {
    logger.error('Error while creating cashflow transaction', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const updateAccountingLedgerTransaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as UpdateAccountingLedgerTransactionBody;
    const transaction = await prisma.accountingLedgerTransaction.update({
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
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Cashflow transaction updated successfully',
      data: transaction,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Cashflow transaction not found',
      });
      return;
    }
    logger.error('Error while updating cashflow transaction', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const deleteAccountingLedgerTransaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await prisma.accountingLedgerTransaction.delete({
      where: { id: String(req.params.id) },
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Cashflow transaction deleted successfully',
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Cashflow transaction not found',
      });
      return;
    }
    logger.error('Error while deleting cashflow transaction', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
