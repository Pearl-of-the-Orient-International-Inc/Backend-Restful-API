import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { AccountingReceivableStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  accountingReceivableInclude,
  buildAccountingReceivableData,
  buildAccountingReceivableItemsData,
  buildNextInvoiceNo,
  resolveReceivableStatus,
} from './accounting-receivable-shared';
import type { Request, Response } from 'express';
import type {
  AccountingReceivableBody,
  GetAccountingReceivablesQuery,
  RecordAccountingReceivablePaymentBody,
  UpdateAccountingReceivableStatusBody,
} from '@/validators/accounting-receivable';

const toNumber = (value: Prisma.Decimal | number | string | null | undefined) => Number(value ?? 0);
const balanceOf = ({ paidAmount, totalAmount }: { paidAmount: Prisma.Decimal | number | string; totalAmount: Prisma.Decimal | number | string }) =>
  Math.max(toNumber(totalAmount) - toNumber(paidAmount), 0);
const formatMonthLabel = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const buildReceivableSummary = async () => {
  const receivables = await prisma.accountingReceivable.findMany({
    select: { customer: true, dueDate: true, invoiceDate: true, paidAmount: true, status: true, totalAmount: true },
  });
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const active = receivables.filter(
    (item) => item.status !== AccountingReceivableStatus.CANCELLED && item.status !== AccountingReceivableStatus.DRAFT,
  );
  const outstanding = active.reduce((total, item) => total + balanceOf(item), 0);
  const collectedThisMonth = active.filter(
    (item) => item.paidAmount.greaterThan(0) && item.invoiceDate >= startOfMonth && item.invoiceDate <= endOfMonth,
  );
  const overdue = active.filter((item) => item.status === AccountingReceivableStatus.OVERDUE);

  const aging = [
    { label: '0 - 30 Days', min: 0, max: 30, color: '#8ccf3f' },
    { label: '31 - 60 Days', min: 31, max: 60, color: '#f7c948' },
    { label: '61 - 90 Days', min: 61, max: 90, color: '#fb923c' },
    { label: 'Over 90 Days', min: 91, max: Number.POSITIVE_INFINITY, color: '#f87171' },
  ].map((bucket) => {
    const value = active.reduce((total, item) => {
      const ageDays = Math.max(Math.floor((now.getTime() - item.invoiceDate.getTime()) / 86_400_000), 0);
      return ageDays >= bucket.min && ageDays <= bucket.max ? total + balanceOf(item) : total;
    }, 0);
    return { label: bucket.label, value, percent: outstanding ? Number(((value / outstanding) * 100).toFixed(1)) : 0, color: bucket.color };
  });

  const customerTotals = new Map<string, number>();
  active.forEach((item) => customerTotals.set(item.customer, (customerTotals.get(item.customer) ?? 0) + balanceOf(item)));
  const topCustomers = Array.from(customerTotals.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);

  const trendMap = new Map<string, number>();
  active
    .filter((item) => item.invoiceDate >= startOfMonth && item.invoiceDate <= endOfMonth)
    .forEach((item) => {
      const label = formatMonthLabel(item.invoiceDate);
      trendMap.set(label, (trendMap.get(label) ?? 0) + balanceOf(item));
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
};

export const getAccountingReceivables = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as GetAccountingReceivablesQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10), 1), 100);
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const where: Prisma.AccountingReceivableWhereInput = {
      status: query.status,
      customer: query.customer ? { equals: query.customer, mode: 'insensitive' } : undefined,
      ...(search
        ? {
            OR: [
              { invoiceNo: { contains: search, mode: 'insensitive' } },
              { customer: { contains: search, mode: 'insensitive' } },
              { reference: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [receivables, total, summary] = await Promise.all([
      prisma.accountingReceivable.findMany({ where, include: accountingReceivableInclude, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.accountingReceivable.count({ where }),
      buildReceivableSummary(),
    ]);
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Accounts receivable retrieved successfully',
      data: receivables,
      summary,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error('Error while getting accounts receivable', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const getAccountingReceivableById = async (req: Request, res: Response): Promise<void> => {
  try {
    const receivable = await prisma.accountingReceivable.findUnique({
      where: { id: String(req.params.id) },
      include: accountingReceivableInclude,
    });
    if (!receivable) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Account receivable not found' });
      return;
    }
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Account receivable retrieved successfully', data: receivable });
  } catch (err) {
    logger.error('Error while getting account receivable', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const createAccountingReceivable = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as AccountingReceivableBody;
    const receivable = await prisma.$transaction(async (tx) => {
      const invoiceNo = await buildNextInvoiceNo(tx, new Date(body.invoiceDate));
      return tx.accountingReceivable.create({
        data: { ...buildAccountingReceivableData(body), invoiceNo, items: { create: buildAccountingReceivableItemsData(body) } },
        include: accountingReceivableInclude,
      });
    });
    res.status(HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Account receivable created successfully', data: receivable });
  } catch (err) {
    logger.error('Error while creating account receivable', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const updateAccountingReceivable = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as AccountingReceivableBody;
    const receivableId = String(req.params.id);
    const exists = await prisma.accountingReceivable.findUnique({ where: { id: receivableId }, select: { id: true } });
    if (!exists) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Account receivable not found' });
      return;
    }
    const receivable = await prisma.$transaction(async (tx) => {
      await tx.accountingReceivableItem.deleteMany({ where: { receivableId } });
      return tx.accountingReceivable.update({
        where: { id: receivableId },
        data: { ...buildAccountingReceivableData(body), items: { create: buildAccountingReceivableItemsData(body) } },
        include: accountingReceivableInclude,
      });
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Account receivable updated successfully', data: receivable });
  } catch (err) {
    logger.error('Error while updating account receivable', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const deleteAccountingReceivable = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const exists = await prisma.accountingReceivable.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Account receivable not found' });
      return;
    }
    await prisma.accountingReceivable.delete({ where: { id } });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Account receivable deleted successfully' });
  } catch (err) {
    logger.error('Error while deleting account receivable', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const updateAccountingReceivableStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as UpdateAccountingReceivableStatusBody;
    const receivable = await prisma.accountingReceivable.update({
      where: { id: String(req.params.id) },
      data: { status: body.status },
      include: accountingReceivableInclude,
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Account receivable status updated successfully', data: receivable });
  } catch (err) {
    logger.error('Error while updating account receivable status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};

export const recordAccountingReceivablePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as RecordAccountingReceivablePaymentBody;
    const existing = await prisma.accountingReceivable.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Account receivable not found' });
      return;
    }
    const paidAmount = new Prisma.Decimal(existing.paidAmount).plus(body.amount).toDecimalPlaces(2);
    const receivable = await prisma.accountingReceivable.update({
      where: { id: existing.id },
      data: {
        paidAmount,
        status: resolveReceivableStatus({ dueDate: existing.dueDate, paidAmount, totalAmount: existing.totalAmount }),
      },
      include: accountingReceivableInclude,
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Payment recorded successfully', data: receivable });
  } catch (err) {
    logger.error('Error while recording account receivable payment', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};
