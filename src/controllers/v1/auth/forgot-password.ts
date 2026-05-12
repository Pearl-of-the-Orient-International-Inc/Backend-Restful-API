/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { calculateExpirationDate, generateUniqueCode } from '@/lib/helpers';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';
import { ForgotPasswordSchema } from '@/validators/auth';
import { VerificationType } from '@/generated/prisma/enums';
import { sendMail } from '@/mailers';
import { forgotPasswordTemplate } from '@/mailers/templates/forgot-password';
import { buildPasswordResetUrl } from '@/lib/verification-redirect';

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body as ForgotPasswordSchema;

  try {
    // Check existing user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      logger.warn('No user found with this email');
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'No user found with this email',
      });
      return;
    }

    // Check if user is an admin
    if (user.role !== 'ADMIN') {
      logger.warn('Non-admin user attempted forgot password', {
        userId: user.id,
        role: user.role,
      });
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    // Generate unique code for forgot password
    const uniqueCode = generateUniqueCode();

    const verificationCode = await prisma.verificationCode.upsert({
      where: {
        userId: user.id,
      },
      update: {
        type: VerificationType.PASSWORD_RESET,
        expiresAt: calculateExpirationDate('1h'),
        code: uniqueCode,
      },
      create: {
        userId: user.id,
        type: VerificationType.PASSWORD_RESET,
        expiresAt: calculateExpirationDate('1h'),
        code: uniqueCode,
      },
    });

    // Sending forgot password email link
    const verificationUrl = buildPasswordResetUrl(
      user.role,
      verificationCode.code,
    );

    const emailResult = await sendMail({
      sendTo: user.email,
      ...forgotPasswordTemplate(verificationUrl, user.name),
    });

    if (!emailResult.success) {
      logger.error('Forgot password email failed to send', {
        userId: user.id,
        email: user.email,
      });
      res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to send reset email',
      });
      return;
    }

    res.sendStatus(HTTPSTATUS.NO_CONTENT);
  } catch (err) {
    // Response with 500 status code for unexpected server errors
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during user forgot password', err);
  }
};
