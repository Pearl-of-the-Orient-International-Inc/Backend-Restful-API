/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { generateAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken as string;

    if (!refreshToken) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Missing refresh token',
      });
      return;
    }

    // Verify refresh token
    const jwtPayload = verifyRefreshToken(refreshToken);

    if (!jwtPayload) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
      return;
    }

    // Verify token exists in database
    const tokenExist = await prisma.userToken.findFirst({
      where: {
        refreshToken,
        userId: jwtPayload.userId,
        sessionId: jwtPayload.sessionId,
      },
    });

    if (!tokenExist) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
      return;
    }

    const accessToken = generateAccessToken(jwtPayload.userId);

    res.status(HTTPSTATUS.OK).json({
      accessToken,
    });
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Refresh token expired. Please login again',
      });
      return;
    }

    if (err instanceof JsonWebTokenError) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
      });
      return;
    }

    logger.error('Error during refresh token', { error: err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
