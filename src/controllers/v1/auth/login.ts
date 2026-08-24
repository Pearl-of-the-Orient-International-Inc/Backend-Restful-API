/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { generateAccessToken, generateMfaToken, generateRefreshToken } from '@/lib/jwt';
import { compareValue } from '@/lib/password-hash';
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
import { MemberStatus, UserAccountStatus } from '@/generated/prisma/enums';
import {
  ActivityLogActionType,
  ActivityLogResult,
} from '@/generated/prisma/client';
import { createActivityLog } from '@/lib/activity-log';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';
import { LoginSchema } from '@/validators/auth';

const formatDateOfBirthPassword = (dateOfBirth?: Date | null) => {
  if (!dateOfBirth) return null;

  const month = String(dateOfBirth.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateOfBirth.getUTCDate()).padStart(2, '0');
  const year = String(dateOfBirth.getUTCFullYear());

  return `${month}${day}${year}`;
};

const getAccountAccessDeniedMessage = (
  accountStatus: UserAccountStatus,
  memberStatus?: MemberStatus | null,
) => {
  if (memberStatus === MemberStatus.REJECTED) {
    return 'Your membership application has been rejected, so this account cannot sign in. Please contact an administrator if you believe this is a mistake.';
  }

  if (accountStatus === UserAccountStatus.PENDING) {
    return 'Your account is pending approval. Your membership application has not been approved yet, so sign-in is temporarily disabled. Please wait for an administrator to approve your account.';
  }

  if (accountStatus === UserAccountStatus.SUSPENDED) {
    return 'Your account is suspended. Sign-in is disabled for this account. Please contact an administrator for help.';
  }

  return 'Your account is not active. Please contact an administrator.';
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, userAgent } = req.body as LoginSchema;
  const loginIdentifier = /^POTSCI-\d{2}-\d{4}-INS$/i.test(email)
    ? email.trim().toUpperCase()
    : email.trim().toLowerCase();
  const ipAddress = getClientIp(req);

  // Handle the user-agent header properly
  const headerUserAgent = req.headers['user-agent'];
  const userAgentString = Array.isArray(headerUserAgent)
    ? headerUserAgent[0]
    : headerUserAgent;

  const finalUserAgent = parseUserAgent(userAgent || userAgentString || null);

  try {
    // Check existing user
    const user = await prisma.user.findUnique({
      where: {
        email: loginIdentifier,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        avatar: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
        twoFactorSecret: true,
        role: true,
        position: true,
        accountStatus: true,
        memberProfile: {
          select: {
            id: true,
            uniqueId: true,
            dateOfBirth: true,
            status: true,
            createdAt: true,
            onboardingProgress: {
              select: {
                currentStep: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      await createActivityLog({
        actorName: email,
        actorEmail: email,
        actionType: ActivityLogActionType.AUTH,
        actionLabel: 'Login attempt',
        moduleLabel: 'Authentication',
        targetLabel: 'Admin portal',
        description: `Login attempt failed because no account exists for ${loginIdentifier}.`,
        result: ActivityLogResult.FAILED,
        ipAddress: ipAddress ?? null,
        deviceLabel: finalUserAgent ?? null,
        metadata: ['Login', 'Unknown account'],
      });

      logger.warn('No user found with this email');
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'No user found with this email',
      });
      return;
    }

    const dateOfBirthPassword = formatDateOfBirthPassword(
      user.memberProfile?.dateOfBirth,
    );
    const isPasswordValid =
      (await compareValue(password, user.password)) ||
      password === dateOfBirthPassword;

    if (!isPasswordValid) {
      await createActivityLog({
        userId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorAvatar: user.avatar,
        actionType: ActivityLogActionType.AUTH,
        actionLabel: 'Login attempt',
        moduleLabel: 'Authentication',
        targetLabel: 'Admin portal',
        description: `Login attempt failed for ${user.email} due to an invalid password.`,
        result: ActivityLogResult.FAILED,
        ipAddress: ipAddress ?? null,
        deviceLabel: finalUserAgent ?? null,
        metadata: ['Login', 'Invalid password'],
      });

      logger.warn('Invalid password attempt', { userId: user.id });
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid password',
      });
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      await createActivityLog({
        userId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorAvatar: user.avatar,
        actionType: ActivityLogActionType.AUTH,
        actionLabel: 'Login attempt',
        moduleLabel: 'Authentication',
        targetLabel: 'Admin portal',
        description: `Login attempt was blocked because ${user.email} has not verified their email.`,
        result: ActivityLogResult.FAILED,
        ipAddress: ipAddress ?? null,
        deviceLabel: finalUserAgent ?? null,
        metadata: ['Login', 'Email verification required'],
      });

      logger.warn('Login attempt with unverified email', {
        userId: user.id,
        email: user.email,
      });
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message:
          'Please verify your email address before logging in. Check your inbox for the verification link.',
        requiresVerification: true,
      });
      return;
    }

    if (user.accountStatus !== UserAccountStatus.ACTIVE) {
      await createActivityLog({
        userId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorAvatar: user.avatar,
        actionType: ActivityLogActionType.AUTH,
        actionLabel: 'Login attempt',
        moduleLabel: 'Authentication',
        targetLabel: 'Admin portal',
        description: `Login attempt was blocked because ${user.email} is not active.`,
        result: ActivityLogResult.FAILED,
        ipAddress: ipAddress ?? null,
        deviceLabel: finalUserAgent ?? null,
        metadata: ['Login', 'Inactive account'],
      });

      logger.warn('Login attempt with inactive account status', {
        userId: user.id,
        email: user.email,
        accountStatus: user.accountStatus,
      });
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: getAccountAccessDeniedMessage(
          user.accountStatus,
          user.memberProfile?.status,
        ),
      });
      return;
    }

    // If 2FA is enabled, require OTP verification before issuing access/refresh tokens.
    if (user.isTwoFactorEnabled) {
      if (!user.twoFactorSecret) {
        logger.warn('User has 2FA enabled but no secret is configured', {
          userId: user.id,
          email: user.email,
        });

        res.status(HTTPSTATUS.FORBIDDEN).json({
          code: 'FORBIDDEN',
          message: 'Two-factor authentication is not configured correctly.',
        });
        return;
      }

      const mfaToken = generateMfaToken(user.id);

      res.status(HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Two-factor authentication required',
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
          memberProfile: user.memberProfile,
        },
        mfaRequired: true,
        mfaToken,
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
      // Send login notification email
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
        // Continue with login process even if email fails
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

    logger.info('User logged in successfully', {
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
      actionLabel: 'Logged in',
      moduleLabel: 'Authentication',
      targetLabel: 'Admin portal',
      description: `${user.name} logged in to the admin portal.`,
      result: ActivityLogResult.SUCCESS,
      ipAddress: ipAddress ?? null,
      deviceLabel: deviceInfo ?? null,
      metadata: ['Login', isNewSession ? 'New session' : 'Existing session'],
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
        memberProfile: user.memberProfile,
      },
      accessToken,
      mfaRequired: false,
    });
  } catch (err) {
    // Response with 500 status code for unexpected server errors
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during user login', err);
  }
};
