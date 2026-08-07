/**
 * Custom Modules
 */
import { logger } from '@/lib/winston';
import {
  calculateExpirationDate,
  generateUniqueCode,
  getClientIp,
  parseUserAgent,
} from '@/lib/helpers';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { HTTPSTATUS } from '@/common/http-codes';
import config from '@/config';
import { buildVerificationUrl } from '@/lib/verification-redirect';
import { sendMail } from '@/mailers';
import { verifyEmailTemplate } from '@/mailers/templates/verify-email';

/**
 * Types
 */
import type { Request, Response } from 'express';
import { ResendVerificationSchema } from '@/validators/auth';
import { VerificationType } from '@/generated/prisma/enums';

export const resendVerification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body as ResendVerificationSchema;

    // Check if the email is existing in the database
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

    // Check if the user is already verified
    if (user.isEmailVerified) {
      logger.warn('You already verified your email');
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'You already verified your email',
      });
      return;
    }

    // Generate unique code for email verification
    const uniqueCode = generateUniqueCode();

    const verificationCode = await prisma.verificationCode.upsert({
      where: {
        userId: user.id,
      },
      update: {
        type: VerificationType.EMAIL_VERIFICATION,
        expiresAt: calculateExpirationDate('36500d'),
        code: uniqueCode,
      },
      create: {
        userId: user.id,
        type: VerificationType.EMAIL_VERIFICATION,
        expiresAt: calculateExpirationDate('36500d'),
        code: uniqueCode,
      },
    });

    // Sending verification email link
    const verificationUrl = buildVerificationUrl(user.role, verificationCode.code);

    const emailResult = await sendMail({
      sendTo: user.email,
      ...verifyEmailTemplate(verificationUrl, user.name),
    });

    if (!emailResult.success) {
      logger.warn('Verification email failed to send, but user was created', {
        userId: user.id,
        email: user.email,
      });
      // User is still registered, they can request a resend later
    }

    // Find or create session so refresh token cookie can be used for GET /session
    const ipAddress = getClientIp(req);
    const userAgent = parseUserAgent(req.headers['user-agent'] ?? null);
    const now = new Date();
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        expiredAt: { gt: now },
      },
    });
    let sessionId: string;
    if (existingSession) {
      await prisma.session.update({
        where: { id: existingSession.id },
        data: { expiredAt: calculateExpirationDate('30d') },
      });
      sessionId = existingSession.id;
    } else {
      const newSession = await prisma.session.create({
        data: {
          userId: user.id,
          userAgent: userAgent ?? null,
          ipAddress: ipAddress ?? null,
          expiredAt: calculateExpirationDate('30d'),
        },
      });
      sessionId = newSession.id;
    }

    // Generate access token and refresh token
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, sessionId);

    // Store/update refresh token
    await prisma.userToken.upsert({
      where: { userId: user.id, sessionId },
      update: {
        refreshToken,
        expiredAt: calculateExpirationDate('7d'),
      },
      create: {
        refreshToken,
        sessionId,
        userId: user.id,
        expiredAt: calculateExpirationDate('7d'),
      },
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Verification code sent successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        position: user.position,
        accountStatus: user.accountStatus,
        isEmailVerified: user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
      accessToken,
      mfaRequired: false,
    });
  } catch (err) {
    logger.error('Error during resend verification code', { error: err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
