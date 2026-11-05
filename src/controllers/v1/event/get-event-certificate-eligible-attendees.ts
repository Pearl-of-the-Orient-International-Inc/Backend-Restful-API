import type { Request, Response } from 'express';

import { HTTPSTATUS } from '@/common/http-codes';
import { EventAttendeeInviteStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Returns only people whose attendance was confirmed after an event ended.
 * This is deliberately separate from the full attendee list so certificate
 * generation can never accidentally include pending or merely approved people.
 */
export const getEventCertificateEligibleAttendees = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!eventId) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'A valid event ID is required',
      });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, endsAt: true },
    });
    if (!event) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Event not found',
      });
      return;
    }
    if (event.endsAt > new Date()) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Certificates can be prepared only after the event has ended',
      });
      return;
    }

    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId, inviteStatus: EventAttendeeInviteStatus.ATTENDED },
      select: { id: true, memberId: true },
      orderBy: { updatedAt: 'asc' },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: `${attendees.length} attended member${attendees.length === 1 ? '' : 's'} are eligible for certificates`,
      data: attendees,
    });
  } catch (err) {
    logger.error('Error retrieving certificate-eligible event attendees', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to retrieve certificate-eligible attendees',
    });
  }
};
