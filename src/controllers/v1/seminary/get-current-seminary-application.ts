import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryApplicationInclude } from './seminary-shared';

import type { Request, Response } from 'express';

export const getCurrentSeminaryApplication = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member profile not found',
      });
      return;
    }

    const application = await prisma.seminaryApplication.findFirst({
      where: { memberId: member.id },
      include: seminaryApplicationInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Current seminary application retrieved successfully',
      data: application,
    });
  } catch (err) {
    logger.error('Error while getting current seminary application', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
