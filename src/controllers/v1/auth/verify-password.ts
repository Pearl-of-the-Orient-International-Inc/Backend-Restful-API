/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { compareValue } from '@/lib/password-hash';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';
import { VerifyPasswordSchema } from '@/validators/auth';

export const verifyPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { oldPassword } = req.body as VerifyPasswordSchema;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    const isPasswordValid = await compareValue(oldPassword, user.password);

    if (!isPasswordValid) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Current password is incorrect',
      });
      return;
    }

    res.sendStatus(HTTPSTATUS.NO_CONTENT);
  } catch (err) {
    logger.error('Error while verifying current password', err);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
