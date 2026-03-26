import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { serializeActivityLog } from './activity-log-shared';

export const getAllActivityLogs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 200;

    const logs = await prisma.activityLog.findMany({
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
      message: 'Activity logs retrieved successfully',
      data: logs.map(serializeActivityLog),
    });
  } catch (err) {
    logger.error('Error while getting activity logs', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
