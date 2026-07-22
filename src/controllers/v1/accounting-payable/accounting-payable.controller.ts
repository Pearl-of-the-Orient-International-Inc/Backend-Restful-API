import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { AccountingPayableStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  accountingPayableInclude,
  buildAccountingPayableData,
  buildAccountingPayableItemsData,
  buildNextBillNo,
  resolvePayableStatus,
} from './accounting-payable-shared';

import type { Request, Response } from 'express';
import type {
  AccountingPayableBody,
  GetAccountingPayablesQuery,
  RecordAccountingPayablePaymentBody,
  UpdateAccountingPayableStatusBody,
} from '@/validators/accounting-payable';

const toNumber = (value: Prisma.Decimal | number | string | null | undefined) =>
  Number(value ?? 0);

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const balanceOf = ({
  paidAmount,
  totalAmount,
}: {
  paidAmount: Prisma.Decimal | number | string;
  totalAmount: Prisma.Decimal | number | string;
}) => Math.max(toNumber(totalAmount) - toNumber(paidAmount), 0);

const buildPayableSummary = async () => {
  const payables = await prisma.accountingPayable.findMany({
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

  const activePayables = payables.filter(
    (payable) =>
      payable.status !== AccountingPayableStatus.CANCELLED &&
      payable.status !== AccountingPayableStatus.DRAFT,
  );
  const outstanding = activePayables.reduce(
    (total, payable) => total + balanceOf(payable),
    0,
  );
  const dueThisWeek = activePayables.filter(
    (payable) => payable.dueDate >= now && payable.dueDate <= endOfWeek,
  );
  const dueThisMonth = activePayables.filter(
    (payable) => payable.dueDate >= startOfMonth && payable.dueDate <= endOfMonth,
  );
  const paidThisMonth = activePayables.filter(
    (payable) =>
      payable.status === AccountingPayableStatus.PAID &&
      payable.billDate >= startOfMonth &&
      payable.billDate <= endOfMonth,
  );

  const agingBuckets = [
    { label: '0 - 30 Days', min: 0, max: 30, color: '#8ccf3f' },
    { label: '31 - 60 Days', min: 31, max: 60, color: '#f7c948' },
    { label: '61 - 90 Days', min: 61, max: 90, color: '#fb923c' },
    { label: 'Over 90 Days', min: 91, max: Number.POSITIVE_INFINITY, color: '#f87171' },
  ].map((bucket) => {
    const value = activePayables.reduce((total, payable) => {
      const ageDays = Math.max(
        Math.floor((now.getTime() - payable.billDate.getTime()) / 86_400_000),
        0,
      );

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

  const categoryTotals = new Map<string, number>();
  activePayables.forEach((payable) => {
    categoryTotals.set(
      payable.category,
      (categoryTotals.get(payable.category) ?? 0) + balanceOf(payable),
    );
  });

  const categoryBreakdown = Array.from(categoryTotals.entries()).map(
    ([label, value]) => ({
      label,
      value,
      percent: outstanding ? Number(((value / outstanding) * 100).toFixed(1)) : 0,
    }),
  );

  const trendMap = new Map<string, number>();
  activePayables
    .filter((payable) => payable.billDate >= startOfMonth && payable.billDate <= endOfMonth)
    .forEach((payable) => {
      const label = formatMonthLabel(payable.billDate);
      trendMap.set(label, (trendMap.get(label) ?? 0) + balanceOf(payable));
    });

  return {
    cards: {
      totalPayables: outstanding,
      dueThisWeek: dueThisWeek.reduce((total, payable) => total + balanceOf(payable), 0),
      dueThisWeekCount: dueThisWeek.length,
      dueThisMonth: dueThisMonth.reduce((total, payable) => total + balanceOf(payable), 0),
      dueThisMonthCount: dueThisMonth.length,
      paidThisMonth: paidThisMonth.reduce(
        (total, payable) => total + toNumber(payable.paidAmount),
        0,
      ),
      paidThisMonthCount: paidThisMonth.length,
    },
    aging: agingBuckets,
    categories: categoryBreakdown,
    trend: Array.from(trendMap.entries()).map(([label, value]) => ({ label, value })),
  };
};

export const getAccountingPayables = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAccountingPayablesQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10), 1), 100);
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.AccountingPayableWhereInput = {
      status: query.status,
      category: query.category ? { equals: query.category, mode: 'insensitive' } : undefined,
      supplier: query.supplier ? { equals: query.supplier, mode: 'insensitive' } : undefined,
      ...(search
        ? {
            OR: [
              { billNo: { contains: search, mode: 'insensitive' } },
              { supplier: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { reference: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [payables, total, summary] = await Promise.all([
      prisma.accountingPayable.findMany({
        where,
        include: accountingPayableInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.accountingPayable.count({ where }),
      buildPayableSummary(),
    ]);

    res.status(HTTPSTATUS.OK).json({
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
  } catch (err) {
    logger.error('Error while getting accounts payable', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const getAccountingPayableById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payable = await prisma.accountingPayable.findUnique({
      where: { id: String(req.params.id) },
      include: accountingPayableInclude,
    });

    if (!payable) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Account payable not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Account payable retrieved successfully',
      data: payable,
    });
  } catch (err) {
    logger.error('Error while getting account payable', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const createAccountingPayable = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as AccountingPayableBody;
    const payable = await prisma.$transaction(async (tx) => {
      const billNo = await buildNextBillNo(tx, new Date(body.billDate));

      return tx.accountingPayable.create({
        data: {
          ...buildAccountingPayableData(body),
          billNo,
          items: {
            create: buildAccountingPayableItemsData(body),
          },
        },
        include: accountingPayableInclude,
      });
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Account payable created successfully',
      data: payable,
    });
  } catch (err) {
    logger.error('Error while creating account payable', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const updateAccountingPayable = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as AccountingPayableBody;
    const payableId = String(req.params.id);
    const exists = await prisma.accountingPayable.findUnique({
      where: { id: payableId },
      select: { id: true },
    });

    if (!exists) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Account payable not found',
      });
      return;
    }

    const payable = await prisma.$transaction(async (tx) => {
      await tx.accountingPayableItem.deleteMany({ where: { payableId } });

      return tx.accountingPayable.update({
        where: { id: payableId },
        data: {
          ...buildAccountingPayableData(body),
          items: {
            create: buildAccountingPayableItemsData(body),
          },
        },
        include: accountingPayableInclude,
      });
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Account payable updated successfully',
      data: payable,
    });
  } catch (err) {
    logger.error('Error while updating account payable', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const deleteAccountingPayable = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payableId = String(req.params.id);
    const exists = await prisma.accountingPayable.findUnique({
      where: { id: payableId },
      select: { id: true },
    });

    if (!exists) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Account payable not found',
      });
      return;
    }

    await prisma.accountingPayable.delete({ where: { id: payableId } });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Account payable deleted successfully',
    });
  } catch (err) {
    logger.error('Error while deleting account payable', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const updateAccountingPayableStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as UpdateAccountingPayableStatusBody;
    const payable = await prisma.accountingPayable.update({
      where: { id: String(req.params.id) },
      data: { status: body.status },
      include: accountingPayableInclude,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Account payable status updated successfully',
      data: payable,
    });
  } catch (err) {
    logger.error('Error while updating account payable status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const recordAccountingPayablePayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as RecordAccountingPayablePaymentBody;
    const existing = await prisma.accountingPayable.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!existing) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Account payable not found',
      });
      return;
    }

    const paidAmount = new Prisma.Decimal(existing.paidAmount)
      .plus(body.amount)
      .toDecimalPlaces(2);
    const payable = await prisma.accountingPayable.update({
      where: { id: existing.id },
      data: {
        paidAmount,
        status: resolvePayableStatus({
          dueDate: existing.dueDate,
          paidAmount,
          totalAmount: existing.totalAmount,
        }),
      },
      include: accountingPayableInclude,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Payment recorded successfully',
      data: payable,
    });
  } catch (err) {
    logger.error('Error while recording account payable payment', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
