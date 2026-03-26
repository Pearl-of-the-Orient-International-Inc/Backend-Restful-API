import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { serializeActivityLog } from './activity-log-shared';

export const getUserActivityLogs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit as string, 10) || 200;

    if (!userId || Array.isArray(userId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid user ID',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role: UserType.ADMIN,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Admin account not found',
      });
      return;
    }

    const logs = await prisma.activityLog.findMany({
      where: {
        userId,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'User activity logs retrieved successfully',
      data: logs.map(serializeActivityLog),
    });
  } catch (err) {
    logger.error('Error while getting user activity logs', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
