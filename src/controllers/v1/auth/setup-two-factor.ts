/**
 * Node Modules
 */
import QRCode from 'qrcode';
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

export const setupTwoFactor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    const generated = speakeasy.generateSecret({
      name: user.email,
      issuer: 'Pearl of the Orient 2FA',
      length: 20,
    });

    if (!generated.base32 || !generated.otpauth_url) {
      res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to initialize two-factor setup',
      });
      return;
    }

    const qrCodeDataUrl = await QRCode.toDataURL(generated.otpauth_url);

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: generated.base32,
        isTwoFactorEnabled: false,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Two-factor authentication setup initialized',
      data: {
        secret: generated.base32,
        otpauthUrl: generated.otpauth_url,
        qrCodeDataUrl,
      },
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during two-factor setup', err);
  }
};
