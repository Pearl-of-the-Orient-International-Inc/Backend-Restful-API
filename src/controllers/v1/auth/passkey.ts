/**
 * Node Modules
 */
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';

/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import {
  PasskeyChallengeType,
  UserType,
} from '@/generated/prisma/enums';
import {
  calculateExpirationDate,
  formatLocalTimestamp,
  getClientIp,
  getLocationFromIP,
  parseUserAgent,
} from '@/lib/helpers';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import config from '@/config';
import { sendMail } from '@/mailers';
import { loginNotificationTemplate } from '@/mailers/templates/login-notification';

/**
 * Types
 */
import type { Request, Response } from 'express';
import type {
  PasskeyAuthenticationOptionsSchema,
  PasskeyAuthenticationVerifySchema,
  PasskeyRegistrationOptionsSchema,
  PasskeyRegistrationVerifySchema,
} from '@/validators/auth';

const normalizeOrigin = (origin: string): string => origin.replace(/\/+$/, '');

const getRpID = (): string => {
  if (config.PASSKEY_RP_ID) {
    return config.PASSKEY_RP_ID;
  }

  try {
    const fromAppUrl = new URL(config.APP_URL).hostname;
    if (fromAppUrl) return fromAppUrl;
  } catch {
    // noop
  }
  return 'localhost';
};

const getExpectedOrigins = (): string[] => {
  const origins = new Set<string>();

  const addOrigin = (origin?: string): void => {
    if (!origin) return;
    origins.add(normalizeOrigin(origin));
  };

  addOrigin(config.APP_URL);
  for (const origin of config.WHITELIST_ORIGINS) addOrigin(origin);
  for (const origin of config.PASSKEY_EXPECTED_ORIGINS) addOrigin(origin);
  addOrigin('http://localhost:3000');

  return [...origins];
};

export const getPasskeyStatus = async (
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

    const count = await prisma.passkeyCredential.count({
      where: { userId },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Passkey status retrieved successfully',
      data: {
        hasPasskey: count > 0,
        count,
      },
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error while retrieving passkey status', err);
  }
};

export const getPasskeyRegistrationOptions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { label } = req.body as PasskeyRegistrationOptionsSchema;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        passkeyCredentials: true,
      },
    });

    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    const options = await generateRegistrationOptions({
      rpName: config.PASSKEY_RP_NAME,
      rpID: getRpID(),
      userName: user.email,
      userDisplayName: user.name,
      userID: new TextEncoder().encode(user.id),
      attestationType: 'none',
      timeout: 60_000,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: user.passkeyCredentials.map((credential) => ({
        id: credential.credentialID,
        transports: credential.transports as AuthenticatorTransport[],
      })),
    });

    await prisma.passkeyChallenge.upsert({
      where: { userId: user.id },
      update: {
        type: PasskeyChallengeType.REGISTRATION,
        challenge: options.challenge,
        expiresAt: calculateExpirationDate('10m'),
      },
      create: {
        userId: user.id,
        type: PasskeyChallengeType.REGISTRATION,
        challenge: options.challenge,
        expiresAt: calculateExpirationDate('10m'),
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Passkey registration options generated successfully',
      data: {
        options,
        label: label ?? null,
      },
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error while generating passkey registration options', err);
  }
};

export const verifyPasskeyRegistration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { response } = req.body as PasskeyRegistrationVerifySchema;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const [user, challengeRow] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
      }),
      prisma.passkeyChallenge.findUnique({
        where: { userId },
      }),
    ]);

    if (!user) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    if (
      !challengeRow ||
      challengeRow.type !== PasskeyChallengeType.REGISTRATION ||
      challengeRow.expiresAt < new Date()
    ) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Passkey registration challenge has expired. Please try again.',
      });
      return;
    }

    const registrationResponse = response as unknown as Parameters<
      typeof verifyRegistrationResponse
    >[0]['response'];

    const transports = Array.isArray(
      (registrationResponse as { response?: { transports?: string[] } }).response
        ?.transports,
    )
      ? ((registrationResponse as { response?: { transports?: string[] } })
          .response?.transports as string[])
      : [];

    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: getExpectedOrigins(),
      expectedRPID: getRpID(),
    });

    if (!verification.verified || !verification.registrationInfo) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Passkey registration verification failed',
      });
      return;
    }

    const {
      credential,
      credentialDeviceType,
      credentialBackedUp,
    } = verification.registrationInfo;

    await prisma.passkeyCredential.upsert({
      where: { credentialID: credential.id },
      update: {
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports,
      },
      create: {
        userId: user.id,
        credentialID: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports,
      },
    });

    await prisma.passkeyChallenge.delete({
      where: { userId: user.id },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Passkey registered successfully',
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    const isConfigMismatch =
      /expectedOrigin|origin|expectedRPID|rpid|challenge|webauthn/i.test(errorMessage);

    res.status(
      isConfigMismatch ? HTTPSTATUS.BAD_REQUEST : HTTPSTATUS.INTERNAL_SERVER_ERROR,
    ).json({
      code: isConfigMismatch ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
      message: isConfigMismatch
        ? `Passkey registration verification failed: ${errorMessage}`
        : 'Internal server error',
    });
    logger.error('Error while verifying passkey registration', err);
  }
};

export const getPasskeyAuthenticationOptions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body as PasskeyAuthenticationOptionsSchema;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        passkeyCredentials: true,
      },
    });

    if (!user) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'No user found with this email',
      });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'Please verify your email address before logging in.',
      });
      return;
    }

    if (user.role === UserType.MEMBER) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'This account is not allowed to access the admin portal.',
      });
      return;
    }

    if (user.passkeyCredentials.length === 0) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'No passkey is configured for this account',
      });
      return;
    }

    const options = await generateAuthenticationOptions({
      rpID: getRpID(),
      timeout: 60_000,
      userVerification: 'preferred',
      allowCredentials: user.passkeyCredentials.map((credential) => ({
        id: credential.credentialID,
        transports: credential.transports as AuthenticatorTransport[],
      })),
    });

    await prisma.passkeyChallenge.upsert({
      where: { userId: user.id },
      update: {
        type: PasskeyChallengeType.AUTHENTICATION,
        challenge: options.challenge,
        expiresAt: calculateExpirationDate('10m'),
      },
      create: {
        userId: user.id,
        type: PasskeyChallengeType.AUTHENTICATION,
        challenge: options.challenge,
        expiresAt: calculateExpirationDate('10m'),
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Passkey authentication options generated successfully',
      data: { options },
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error while generating passkey authentication options', err);
  }
};

export const verifyPasskeyAuthentication = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, response, userAgent } = req.body as PasskeyAuthenticationVerifySchema;
  const ipAddress = getClientIp(req);

  // Handle the user-agent header properly
  const headerUserAgent = req.headers['user-agent'];
  const userAgentString = Array.isArray(headerUserAgent)
    ? headerUserAgent[0]
    : headerUserAgent;
  const finalUserAgent = parseUserAgent(userAgent || userAgentString || null);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        passkeyCredentials: true,
        passkeyChallenge: true,
      },
    });

    if (!user) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'No user found with this email',
      });
      return;
    }

    const challengeRow = user.passkeyChallenge;
    if (
      !challengeRow ||
      challengeRow.type !== PasskeyChallengeType.AUTHENTICATION ||
      challengeRow.expiresAt < new Date()
    ) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Passkey authentication challenge has expired. Please try again.',
      });
      return;
    }

    const storedCredential = user.passkeyCredentials.find(
      (credential) => credential.credentialID === response.id,
    );

    if (!storedCredential) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Passkey credential is not recognized for this account',
      });
      return;
    }

    const authenticationResponse = response as unknown as Parameters<
      typeof verifyAuthenticationResponse
    >[0]['response'];

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: getExpectedOrigins(),
      expectedRPID: getRpID(),
      credential: {
        id: storedCredential.credentialID,
        publicKey: new Uint8Array(storedCredential.publicKey),
        counter: storedCredential.counter,
        transports: storedCredential.transports as AuthenticatorTransport[],
      },
    });

    if (!verification.verified) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Passkey authentication failed',
      });
      return;
    }

    await prisma.$transaction([
      prisma.passkeyCredential.update({
        where: { credentialID: storedCredential.credentialID },
        data: {
          counter: verification.authenticationInfo.newCounter,
        },
      }),
      prisma.passkeyChallenge.delete({
        where: { userId: user.id },
      }),
    ]);

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

    logger.info('User logged in successfully with passkey', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ipAddress,
      location,
      device: deviceInfo,
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
        isEmailVerified: user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
      accessToken,
      mfaRequired: false,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    const isConfigMismatch =
      /expectedOrigin|origin|expectedRPID|rpid|challenge|webauthn/i.test(errorMessage);

    res.status(
      isConfigMismatch ? HTTPSTATUS.BAD_REQUEST : HTTPSTATUS.INTERNAL_SERVER_ERROR,
    ).json({
      code: isConfigMismatch ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
      message: isConfigMismatch
        ? `Passkey authentication failed: ${errorMessage}`
        : 'Internal server error',
    });
    logger.error('Error while verifying passkey authentication', err);
  }
};
