import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { ensureItAdmin } from './member-admin-guards';

import type { Request, Response } from 'express';

export const verifyMemberEmailByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = req.params.id;

    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid member ID',
      });
      return;
    }

    if (!(await ensureItAdmin(req.userId, res))) {
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            isEmailVerified: true,
            email: true,
          },
        },
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    if (member.user.isEmailVerified) {
      res.status(HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Member email is already verified',
      });
      return;
    }

    await prisma.user.update({
      where: { id: member.userId },
      data: { isEmailVerified: true },
    });

    logger.info('Member email verified by IT admin', {
      memberId,
      email: member.user.email,
      adminUserId: req.userId,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member email verified successfully',
    });
  } catch (err) {
    logger.error('Error while verifying member email by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
