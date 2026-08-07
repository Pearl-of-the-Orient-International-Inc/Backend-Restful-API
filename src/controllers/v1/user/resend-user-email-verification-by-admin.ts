import { HTTPSTATUS } from '@/common/http-codes';
import { UserType, VerificationType } from '@/generated/prisma/enums';
import {
  calculateExpirationDate,
  generateUniqueCode,
} from '@/lib/helpers';
import { prisma } from '@/lib/prisma';
import { buildVerificationUrl } from '@/lib/verification-redirect';
import { logger } from '@/lib/winston';
import { sendMail } from '@/mailers';
import { verifyEmailTemplate } from '@/mailers/templates/verify-email';
import { ensureItAdmin } from './user-admin-guards';

import type { Request, Response } from 'express';

export const resendUserEmailVerificationByAdmin = async (
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
        name: true,
        email: true,
        role: true,
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

    if (user.isEmailVerified) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Email address is already verified',
      });
      return;
    }

    const uniqueCode = generateUniqueCode();

    const verificationCode = await prisma.verificationCode.upsert({
      where: { userId: user.id },
      update: {
        type: VerificationType.EMAIL_VERIFICATION,
        expiresAt: calculateExpirationDate('1h'),
        code: uniqueCode,
      },
      create: {
        userId: user.id,
        type: VerificationType.EMAIL_VERIFICATION,
        expiresAt: calculateExpirationDate('1h'),
        code: uniqueCode,
      },
    });

    const verificationUrl = buildVerificationUrl(
      user.role,
      verificationCode.code,
    );

    const emailResult = await sendMail({
      sendTo: user.email,
      ...verifyEmailTemplate(verificationUrl, user.name),
    });

    if (!emailResult.success) {
      res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Verification email failed to send',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Verification email sent successfully',
    });
  } catch (err) {
    logger.error('Error while resending account verification by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
