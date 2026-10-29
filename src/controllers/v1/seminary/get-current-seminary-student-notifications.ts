import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getCurrentSeminaryStudentNotifications = async (
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

    const student = await prisma.seminaryApplication.findFirst({
      where: {
        studentId: { not: null },
        OR: [{ portalUserId: userId }, { member: { userId } }],
      },
      select: { id: true },
    });

    if (!student) {
      res.status(HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Student notifications retrieved successfully',
        data: [],
      });
      return;
    }

    const notifications = await prisma.seminaryStudentNotification.findMany({
      where: { studentApplicationId: student.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Student notifications retrieved successfully',
      data: notifications,
    });
  } catch (err) {
    logger.error('Error while getting seminary student notifications', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
