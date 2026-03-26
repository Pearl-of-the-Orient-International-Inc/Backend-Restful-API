import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import type { Prisma } from '@/generated/prisma/client';
import { EventAttendeeAccessLevel, EventAttendeeInviteStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { InviteEventAttendeesSchema } from '@/validators/event';

const attendeeInclude = {
  member: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  },
} as const;

type EventAttendeeWithMember = Prisma.EventAttendeeGetPayload<{
  include: typeof attendeeInclude;
}>;

const serializeAttendee = (attendee: EventAttendeeWithMember) => ({
  id: attendee.id,
  memberId: attendee.memberId,
  accessLevel: attendee.accessLevel,
  inviteStatus: attendee.inviteStatus,
  invitedAt: attendee.invitedAt,
  updatedAt: attendee.updatedAt,
  member: {
    id: attendee.member.id,
    fullName:
      `${attendee.member.firstName} ${attendee.member.lastName}`.trim() ||
      attendee.member.user.name,
    email: attendee.member.user.email,
    avatar: attendee.member.user.avatar,
    userId: attendee.member.user.id,
  },
});

export const inviteEventAttendees = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid Event ID is required',
      });
      return;
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!event) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Event not found',
      });
      return;
    }

    const { memberIds } = req.body as InviteEventAttendeesSchema;

    const members = await prisma.member.findMany({
      where: {
        id: { in: memberIds },
        isActive: true,
      },
      select: { id: true },
    });

    if (!members.length) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'No active members were selected for invitation',
      });
      return;
    }

    await prisma.eventAttendee.createMany({
      data: members.map((member) => ({
        eventId: id,
        memberId: member.id,
        accessLevel: EventAttendeeAccessLevel.FULL_ACCESS,
        inviteStatus: EventAttendeeInviteStatus.INVITED,
      })),
      skipDuplicates: true,
    });

    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId: id },
      orderBy: { invitedAt: 'asc' },
      include: attendeeInclude,
    });

    logger.info('Event attendees invited successfully', {
      eventId: event.id,
      invitedCount: members.length,
      totalAttendees: attendees.length,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Event attendees invited successfully',
      data: attendees.map(serializeAttendee),
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during event attendee invitation', err);
  }
};
