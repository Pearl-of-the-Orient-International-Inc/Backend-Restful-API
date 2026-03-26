/**
 * Node Modules
 */
import speakeasy from 'speakeasy';

/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { generateAccessToken, generateRefreshToken, verifyMfaToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  calculateExpirationDate,
  formatLocalTimestamp,
  getClientIp,
  getLocationFromIP,
  parseUserAgent,
} from '@/lib/helpers';
import config from '@/config';
import { sendMail } from '@/mailers';
import { loginNotificationTemplate } from '@/mailers/templates/login-notification';
import { UserAccountStatus } from '@/generated/prisma/enums';
import {
  ActivityLogActionType,
  ActivityLogResult,
} from '@/generated/prisma/client';
import { createActivityLog } from '@/lib/activity-log';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';
import { VerifyTwoFactorSchema } from '@/validators/auth';

export const verifyTwoFactor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { mfaToken, token, userAgent } = req.body as VerifyTwoFactorSchema;
  const ipAddress = getClientIp(req);

  // Handle the user-agent header properly
  const headerUserAgent = req.headers['user-agent'];
  const userAgentString = Array.isArray(headerUserAgent)
    ? headerUserAgent[0]
    : headerUserAgent;

  const finalUserAgent = parseUserAgent(userAgent || userAgentString || null);

  try {
    const payload = verifyMfaToken(mfaToken);

    if (!payload?.userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired MFA session. Please login again.',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Two-factor authentication is not enabled for this account',
      });
      return;
    }

    if (user.accountStatus !== UserAccountStatus.ACTIVE) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'Your account is not active. Please contact an administrator.',
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
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication code',
      });
      return;
    }

    const now = new Date();

    // Find or create session
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        ipAddress: ipAddress ?? null,
        userAgent: finalUserAgent ?? null,
        expiredAt: { gt: now },
      },
    });

    // Track if this is a new session
    let isNewSession = false;
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
          userAgent: finalUserAgent ?? null,
          ipAddress: ipAddress ?? null,
          expiredAt: calculateExpirationDate('30d'),
        },
      });
      sessionId = newSession.id;
      isNewSession = true;
    }

    // Generate access token for logged in user
    const accessToken = generateAccessToken(user.id);

    // Generate refresh token for logged in user
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

    // Prepare login notification email data
    const timestamp = formatLocalTimestamp(now);
    const deviceInfo = parseUserAgent(finalUserAgent);
    const location = await getLocationFromIP(ipAddress);

    // Send login notification email only for new sessions
    if (isNewSession) {
      const emailResult = await sendMail({
        sendTo: user.email,
        ...loginNotificationTemplate(
          user.name,
          timestamp,
          deviceInfo,
          ipAddress || 'Unknown',
          location,
        ),
      });

      if (!emailResult.success) {
        logger.warn('Login notification email failed to send', {
          userId: user.id,
          email: user.email,
        });
      } else {
        logger.info('Login notification email sent successfully', {
          userId: user.id,
          email: user.email,
        });
      }
    }

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info('User logged in successfully with MFA', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ipAddress,
      location,
      device: deviceInfo,
    });

    await createActivityLog({
      userId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorAvatar: user.avatar,
      actionType: ActivityLogActionType.AUTH,
      actionLabel: 'Logged in with two-factor authentication',
      moduleLabel: 'Authentication',
      targetLabel: 'Admin portal',
      description: `${user.name} logged in using two-factor authentication.`,
      result: ActivityLogResult.SUCCESS,
      ipAddress: ipAddress ?? null,
      deviceLabel: deviceInfo ?? null,
      metadata: ['Login', 'Two-factor authentication'],
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'User logged in successfully',
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
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during user two-factor verification login', err);
  }
};
