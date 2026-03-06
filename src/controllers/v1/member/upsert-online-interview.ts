import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpsertOnlineInterviewAppointmentBody } from './types';

export const upsertOnlineInterview = async (
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
        message: 'Member application not found',
      });
      return;
    }

    const body = req.body as UpsertOnlineInterviewAppointmentBody;

    const appointment = await prisma.memberOnlineInterviewAppointment.upsert({
      where: { memberId: member.id },
      create: {
        memberId: member.id,
        interviewerId: body.interviewerId,
        interviewerName: body.interviewerName,
        day: body.day,
        timeSlot: body.timeSlot,
        zoomLink: body.zoomLink,
        meetingId: body.meetingId ?? null,
        passcode: body.passcode ?? null,
        confirmedAt: new Date(),
      },
      update: {
        interviewerId: body.interviewerId,
        interviewerName: body.interviewerName,
        day: body.day,
        timeSlot: body.timeSlot,
        zoomLink: body.zoomLink,
        meetingId: body.meetingId ?? null,
        passcode: body.passcode ?? null,
        confirmedAt: new Date(),
      },
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
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Online interview appointment saved successfully',
      data: appointment,
    });
  } catch (err) {
    logger.error('Error while saving online interview appointment', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
