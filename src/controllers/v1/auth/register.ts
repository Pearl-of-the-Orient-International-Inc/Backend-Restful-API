/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { User } from '@/generated/prisma/client';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { hashValue } from '@/lib/password-hash';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  calculateExpirationDate,
  getClientIp,
  parseUserAgent,
} from '@/lib/helpers';
import config from '@/config';

/**
 * Types
 */
import type { Request, Response } from 'express';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, avatar, role } = req.body as User;

  const hashedPassword = await hashValue(password);

  try {
    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      logger.warn('An account with this email already exists');
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'An account with this email already exists',
      });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name: name,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
      },
    });

    // Create session so refresh token cookie can be used for GET /session
    const ipAddress = getClientIp(req);
    const userAgent = parseUserAgent(req.headers['user-agent'] ?? null);
    const newSession = await prisma.session.create({
      data: {
        userId: user.id,
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
        expiredAt: calculateExpirationDate('30d'),
      },
    });

    // Generate access token for registered user
    const accessToken = generateAccessToken(user.id);

    // Generate refresh token for registered user
    const refreshToken = generateRefreshToken(user.id, newSession.id);

    // Store refreshToken in database
    await prisma.userToken.create({
      data: {
        refreshToken,
        userId: user.id,
        sessionId: newSession.id,
        expiredAt: calculateExpirationDate(
          config.JWT_REFRESH_EXPIRES_IN || '7d',
        ),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message:
        'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
    });
  } catch (err) {
    // Response with 500 status code for unexpected server errors
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during user registration', err);
  }
};
