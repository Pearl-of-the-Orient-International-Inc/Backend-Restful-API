import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type {
  AcknowledgementReceiptBody,
  GetAcknowledgementReceiptsQuery,
} from '@/validators/accounting-acknowledgement-receipt';

const receiptInclude = {
  items: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.AccountingAcknowledgementReceiptInclude;

const toDecimal = (value?: number | string | null) =>
  new Prisma.Decimal(value ?? 0).toDecimalPlaces(2);
const trimToNull = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};
const parseDate = (value: string) => new Date(value);

const calculateTotal = (body: AcknowledgementReceiptBody) =>
  body.items
    .reduce(
      (total, item) => total.add(toDecimal(item.amount)),
      new Prisma.Decimal(0),
    )
    .toDecimalPlaces(2);

const buildNextReceiptNo = async (
  tx: Prisma.TransactionClient,
  date = new Date(),
) => {
  const yearSuffix = String(date.getFullYear()).slice(-2);
  const prefix = `AR-${yearSuffix}-`;
  const latestReceipt = await tx.accountingAcknowledgementReceipt.findFirst({
    where: { receiptNo: { startsWith: prefix } },
    orderBy: { receiptNo: 'desc' },
    select: { receiptNo: true },
  });
  const latestSeries = latestReceipt?.receiptNo
    ? Number.parseInt(latestReceipt.receiptNo.slice(prefix.length), 10)
    : 0;
  const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;
  return `${prefix}${String(nextSeries).padStart(4, '0')}`;
};

const buildReceiptData = (body: AcknowledgementReceiptBody) => ({
  organization: body.organization,
  name: body.name.trim(),
  receiptDate: parseDate(body.receiptDate),
  course: trimToNull(body.course),
  school: trimToNull(body.school),
  paymentType: body.paymentType,
  checkNo: trimToNull(body.checkNo),
  cashier: trimToNull(body.cashier),
  remarks: trimToNull(body.remarks),
  totalAmount: calculateTotal(body),
});

const buildReceiptItemsData = (body: AcknowledgementReceiptBody) =>
  body.items.map((item, index) => ({
    particulars: item.particulars.trim(),
    amount: toDecimal(item.amount),
    remarks: trimToNull(item.remarks),
    sortOrder: index,
  }));

export const getAcknowledgementReceipts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAcknowledgementReceiptsQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10), 1), 100);
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const where: Prisma.AccountingAcknowledgementReceiptWhereInput = {
      organization: query.organization,
      ...(search
        ? {
            OR: [
              { receiptNo: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { course: { contains: search, mode: 'insensitive' } },
              { school: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [receipts, total, summaryRows] = await Promise.all([
      prisma.accountingAcknowledgementReceipt.findMany({
        where,
        include: receiptInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.accountingAcknowledgementReceipt.count({ where }),
      prisma.accountingAcknowledgementReceipt.findMany({
        where,
        select: { totalAmount: true, organization: true },
      }),
    ]);

    const summary = {
      cards: {
        receipts: total,
        totalAmount: summaryRows.reduce(
          (sum, receipt) => sum + Number(receipt.totalAmount),
          0,
        ),
      },
      organizations: summaryRows.reduce<Record<string, number>>((acc, receipt) => {
        acc[receipt.organization] = (acc[receipt.organization] ?? 0) + 1;
        return acc;
      }, {}),
    };

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Acknowledgement receipts retrieved successfully',
      data: receipts,
      summary,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error('Error while getting acknowledgement receipts', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const getAcknowledgementReceiptById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const receipt = await prisma.accountingAcknowledgementReceipt.findUnique({
      where: { id: String(req.params.id) },
      include: receiptInclude,
    });
    if (!receipt) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Acknowledgement receipt not found',
      });
      return;
    }
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Acknowledgement receipt retrieved successfully',
      data: receipt,
    });
  } catch (err) {
    logger.error('Error while getting acknowledgement receipt', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const createAcknowledgementReceipt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as AcknowledgementReceiptBody;
    const receipt = await prisma.$transaction(async (tx) => {
      const receiptNo = await buildNextReceiptNo(tx, new Date(body.receiptDate));
      return tx.accountingAcknowledgementReceipt.create({
        data: {
          ...buildReceiptData(body),
          receiptNo,
          items: { create: buildReceiptItemsData(body) },
        },
        include: receiptInclude,
      });
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Acknowledgement receipt created successfully',
      data: receipt,
    });
  } catch (err) {
    logger.error('Error while creating acknowledgement receipt', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const deleteAcknowledgementReceipt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = String(req.params.id);
    const exists = await prisma.accountingAcknowledgementReceipt.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Acknowledgement receipt not found',
      });
      return;
    }

    await prisma.accountingAcknowledgementReceipt.delete({ where: { id } });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Acknowledgement receipt deleted successfully',
    });
  } catch (err) {
    logger.error('Error while deleting acknowledgement receipt', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
