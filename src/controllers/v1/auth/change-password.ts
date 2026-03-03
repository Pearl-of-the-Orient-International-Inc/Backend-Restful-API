/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { compareValue, hashValue } from '@/lib/password-hash';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';
import { ChangePasswordSchema } from '@/validators/auth';

export const changePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { oldPassword, password } = req.body as ChangePasswordSchema;

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

    const hashedPassword = await hashValue(password);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    res.sendStatus(HTTPSTATUS.NO_CONTENT);
  } catch (err) {
    logger.error('Error while changing password', err);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
