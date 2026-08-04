import { HTTPSTATUS } from '@/common/http-codes';
import { SeminaryFeeCollectionStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  normalizeFeeCollectionStatus,
  toFeeCollectionResponse,
} from './fee-collection-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryFeeCollectionPaymentBody } from './types';

const getAutoStatus = ({
  amountPaid,
  balance,
}: {
  amountPaid: number;
  balance: number;
}) => {
  if (balance <= 0) return SeminaryFeeCollectionStatus.PAID;
  if (amountPaid > 0) return SeminaryFeeCollectionStatus.PARTIALLY_PAID;
  return SeminaryFeeCollectionStatus.PENDING;
};

export const updateSeminaryFeeCollectionPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryFeeCollectionPaymentBody;
    const existingAccount = await prisma.seminaryFeeCollectionAccount.findUnique({
      where: { id },
      select: { id: true, totalCharges: true },
    });

    if (!existingAccount) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary fee collection account not found',
      });
      return;
    }

    const amountPaid = body.amountPaid;
    const totalCharges = Number(existingAccount.totalCharges);
    const balance = Math.max(totalCharges - amountPaid, 0);
    const status = body.status
      ? normalizeFeeCollectionStatus(body.status)
      : getAutoStatus({ amountPaid, balance });

    const account = await prisma.seminaryFeeCollectionAccount.update({
      where: { id },
      data: {
        amountPaid,
        balance,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        paymentMethod: body.paymentMethod,
        status,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary fee collection payment updated successfully',
      data: toFeeCollectionResponse(account),
    });
  } catch (err) {
    logger.error('Error while updating seminary fee collection payment', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
