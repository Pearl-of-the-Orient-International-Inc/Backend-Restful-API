import { HTTPSTATUS } from '@/common/http-codes';
import { MemberPaymentMethod } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpsertPaymentCheckoutBody } from './types';

export const upsertPaymentCheckout = async (
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
      select: { id: true },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member application not found',
      });
      return;
    }

    const body = req.body as UpsertPaymentCheckoutBody;
    const isPromissoryNote = body.isPromissoryNote === true;
    const proofOfPaymentUrl = body.proofOfPaymentUrl ?? null;
    const promissoryNoteUrl = body.promissoryNoteUrl ?? null;

    if (
      body.paymentMethod !== MemberPaymentMethod.CASH &&
      !isPromissoryNote &&
      !proofOfPaymentUrl
    ) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Proof of payment is required for non-cash payment method',
      });
      return;
    }

    if (isPromissoryNote && !promissoryNoteUrl) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Signed promissory note is required when promissory note is checked',
      });
      return;
    }

    const paymentCheckout = await prisma.memberPaymentCheckout.upsert({
      where: { memberId: member.id },
      create: {
        memberId: member.id,
        paymentMethod: body.paymentMethod,
        proofOfPaymentUrl,
        isPromissoryNote,
        promissoryNoteUrl,
        submittedAt: new Date(),
      },
      update: {
        paymentMethod: body.paymentMethod,
        proofOfPaymentUrl,
        isPromissoryNote,
        promissoryNoteUrl,
        submittedAt: new Date(),
      },
      select: {
        paymentMethod: true,
        proofOfPaymentUrl: true,
        isPromissoryNote: true,
        promissoryNoteUrl: true,
        submittedAt: true,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Payment checkout saved successfully',
      data: paymentCheckout,
    });
  } catch (err) {
    logger.error('Error while saving payment checkout', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
