import { HTTPSTATUS } from '@/common/http-codes';
import { UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { ensureItAdmin } from './user-admin-guards';

import type { Request, Response } from 'express';

export const verifyUserEmailByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const canAccess = await ensureItAdmin(req.userId, res);
    if (!canAccess) return;

    const userId = req.params.userId;

    if (!userId || Array.isArray(userId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid user ID',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: UserType.ADMIN },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Admin account not found',
      });
      return;
    }

    if (!user.isEmailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });

      logger.info('Admin account email verified by IT admin', {
        userId: user.id,
        email: user.email,
        adminUserId: req.userId,
      });
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: user.isEmailVerified
        ? 'Email address is already verified'
        : 'Email address verified successfully',
    });
  } catch (err) {
    logger.error('Error while verifying account email by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
