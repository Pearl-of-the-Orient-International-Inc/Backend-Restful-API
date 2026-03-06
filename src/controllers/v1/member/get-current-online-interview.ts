import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getCurrentOnlineInterview = async (
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
      select: {
        id: true,
        onlineInterviewAppointment: {
          select: {
            interviewerId: true,
            interviewerName: true,
            day: true,
            timeSlot: true,
            zoomLink: true,
            meetingId: true,
            passcode: true,
            confirmedAt: true,
          },
        },
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member application not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Online interview appointment retrieved successfully',
      data: member.onlineInterviewAppointment,
    });
  } catch (err) {
    logger.error('Error while getting online interview appointment', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
