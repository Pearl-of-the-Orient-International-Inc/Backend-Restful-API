/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import config from '@/config';
import {
  ActivityLogActionType,
  ActivityLogResult,
} from '@/generated/prisma/client';
import { createActivityLog } from '@/lib/activity-log';
import { getClientIp, parseUserAgent } from '@/lib/helpers';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.userId
      ? await prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        })
      : null;

    const refreshToken = req.cookies.refreshToken as string;
    if (refreshToken) {
      await prisma.userToken.delete({
        where: {
          refreshToken,
        },
      });

      logger.info('User refresh token deleted successfully', {
        userId: req.userId,
        token: refreshToken,
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info('User logged out successfully', {
      userId: req.userId,
    });

    if (user) {
      await createActivityLog({
        userId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorAvatar: user.avatar,
        actionType: ActivityLogActionType.AUTH,
        actionLabel: 'Logged out',
        moduleLabel: 'Authentication',
        targetLabel: 'Admin portal session',
        description: `${user.name} logged out from the admin portal.`,
        result: ActivityLogResult.SUCCESS,
        ipAddress: getClientIp(req) ?? null,
        deviceLabel: parseUserAgent(req.headers['user-agent'] ?? null) ?? null,
        metadata: ['Logout'],
      });
    }

    res.sendStatus(HTTPSTATUS.NO_CONTENT);
  } catch (err) {
    // Response with 500 status code for unexpected server errors
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during user logout', err);
  }
};
