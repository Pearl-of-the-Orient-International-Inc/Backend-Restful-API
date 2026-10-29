import { HTTPSTATUS } from '@/common/http-codes';
import { SeminaryFeeCollectionStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  normalizeFeeCollectionStatus,
  toFeeCollectionResponse,
} from './fee-collection-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryFeeCollectionStatusBody } from './types';

export const updateSeminaryFeeCollectionStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryFeeCollectionStatusBody;

    const existingAccount = await prisma.seminaryFeeCollectionAccount.findUnique({
      where: { id },
      select: { amountPaid: true, balance: true, id: true },
    });

    if (!existingAccount) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary fee collection account not found',
      });
      return;
    }

    const status = normalizeFeeCollectionStatus(body.status);
    if (
      status === SeminaryFeeCollectionStatus.PAID &&
      Number(existingAccount.balance) > 0
    ) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'UNSETTLED_ACCOUNT',
        message: 'An account cannot be marked paid while it still has a balance.',
      });
      return;
    }
    if (
      status === SeminaryFeeCollectionStatus.PARTIALLY_PAID &&
      Number(existingAccount.amountPaid) <= 0
    ) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'NO_PAYMENT_RECORDED',
        message: 'Record a payment amount before marking an account partially paid.',
      });
      return;
    }

    const account = await prisma.seminaryFeeCollectionAccount.update({
      where: { id },
      data: { status },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary fee collection status updated successfully',
      data: toFeeCollectionResponse(account),
    });
  } catch (err) {
    logger.error('Error while updating seminary fee collection status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
