import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getCurrentPaymentCheckout = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { userId },
      select: {
        id: true,
        paymentCheckout: {
          select: {
            paymentMethod: true,
            proofOfPaymentUrl: true,
            isPromissoryNote: true,
            promissoryNoteUrl: true,
            submittedAt: true,
          },
        },
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member application not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Payment checkout retrieved successfully',
      data: member.paymentCheckout,
    });
  } catch (err) {
    logger.error('Error while getting payment checkout', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
