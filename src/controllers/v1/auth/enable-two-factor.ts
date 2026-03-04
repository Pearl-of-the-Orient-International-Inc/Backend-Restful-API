/**
 * Node Modules
 */
import speakeasy from 'speakeasy';

/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response } from 'express';
import type { TwoFactorEnableSchema } from '@/validators/auth';

export const enableTwoFactor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { token } = req.body as TwoFactorEnableSchema;

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
        twoFactorSecret: true,
      },
    });

    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    if (!user.twoFactorSecret) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Two-factor setup not initialized. Please configure first.',
      });
      return;
    }

    const isValidToken = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValidToken) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid authentication code',
      });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error while enabling two-factor authentication', err);
  }
};
