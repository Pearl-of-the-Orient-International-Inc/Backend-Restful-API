import type { Request, Response } from 'express';

import { HTTPSTATUS } from '@/common/http-codes';
import {
  EventAttendeeInviteStatus,
  EventStatus,
  EventVisibility,
  MemberStatus,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { ReviewEventAttendeeSchema } from '@/validators/event';

const attendeeInclude = {
  member: {
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      extensionName: true,
      uniqueId: true,
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  },
} as const;

const serializeAttendee = (attendee: any) => ({
  id: attendee.id,
  memberId: attendee.memberId,
  accessLevel: attendee.accessLevel,
  inviteStatus: attendee.inviteStatus,
  invitedAt: attendee.invitedAt,
  updatedAt: attendee.updatedAt,
  member: {
    id: attendee.member.id,
    fullName:
      [
        attendee.member.firstName,
        attendee.member.middleInitial
          ? `${attendee.member.middleInitial.replace(/\.$/, '')}.`
          : null,
        attendee.member.lastName,
        attendee.member.extensionName,
      ]
        .filter(Boolean)
        .join(' ') || attendee.member.user.name,
    memberNumber: attendee.member.uniqueId,
    email: attendee.member.user.email,
    avatar: attendee.member.user.avatar,
    userId: attendee.member.user.id,
  },
});

export const registerCurrentMemberForEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!eventId || !req.userId) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Valid event and member session are required' });
      return;
    }

    const [event, member] = await Promise.all([
      prisma.event.findFirst({
        where: {
          id: eventId,
          visibility: EventVisibility.PUBLIC,
          status: { not: EventStatus.CANCELLED },
        },
        select: { id: true, name: true, endsAt: true },
      }),
      prisma.member.findFirst({
        where: { userId: req.userId, isActive: true, status: MemberStatus.APPROVED },
        select: { id: true },
      }),
    ]);

    if (!event) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'This public event is no longer available for registration' });
      return;
    }
    if (!member) {
      res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'Only active approved members can join an event' });
      return;
    }
    if (event.endsAt <= new Date()) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Registration is closed because this event has already ended' });
      return;
    }

    const attendee = await prisma.eventAttendee.upsert({
      where: { eventId_memberId: { eventId, memberId: member.id } },
      create: {
        eventId,
        memberId: member.id,
        inviteStatus: EventAttendeeInviteStatus.PENDING_APPROVAL,
      },
      update: {
        inviteStatus: EventAttendeeInviteStatus.PENDING_APPROVAL,
        invitedAt: new Date(),
      },
      include: attendeeInclude,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: `Your registration for ${event.name} is awaiting administrator approval`,
      data: serializeAttendee(attendee),
    });
  } catch (err) {
    logger.error('Error while registering a member for an event', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to submit the event registration' });
  }
};

export const getCurrentMemberEventRegistration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!eventId || !req.userId) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Valid event and member session are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.userId, isActive: true, status: MemberStatus.APPROVED },
      select: { id: true },
    });
    if (!member) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'Only active approved members can view their event registration',
      });
      return;
    }

    const attendee = await prisma.eventAttendee.findUnique({
      where: { eventId_memberId: { eventId, memberId: member.id } },
      include: {
        event: {
          select: {
            id: true,
            type: true,
            location: true,
            onlineLink: true,
            meetingPlatform: true,
            meetingId: true,
            meetingPassword: true,
          },
        },
      },
    });
    if (!attendee) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'You have not registered for this event',
      });
      return;
    }

    const approved =
      attendee.inviteStatus === EventAttendeeInviteStatus.APPROVED ||
      attendee.inviteStatus === EventAttendeeInviteStatus.ATTENDED;

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: approved
        ? 'Your event access details are available'
        : 'Your registration is awaiting administrator approval',
      data: {
        registrationStatus: attendee.inviteStatus,
        accessDetails: approved
          ? {
              type: attendee.event.type,
              location: attendee.event.location,
              onlineLink: attendee.event.onlineLink,
              meetingPlatform: attendee.event.meetingPlatform,
              meetingId: attendee.event.meetingId,
              meetingPassword: attendee.event.meetingPassword,
            }
          : null,
      },
    });
  } catch (err) {
    logger.error('Error retrieving a member event registration', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to retrieve your event registration',
    });
  }
};

export const reviewEventAttendee = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const attendeeId = Array.isArray(req.params.attendeeId)
      ? req.params.attendeeId[0]
      : req.params.attendeeId;
    const { status } = req.body as ReviewEventAttendeeSchema['body'];

    if (!eventId || !attendeeId) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Valid event and attendee IDs are required' });
      return;
    }

    const attendee = await prisma.eventAttendee.findFirst({
      where: { id: attendeeId, eventId },
      include: { event: { select: { id: true, name: true, endsAt: true } } },
    });
    if (!attendee) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Event registration not found' });
      return;
    }
    if (status === EventAttendeeInviteStatus.ATTENDED && attendee.event.endsAt > new Date()) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Attendance can only be confirmed after the event end date' });
      return;
    }
    if (status === EventAttendeeInviteStatus.ATTENDED && attendee.inviteStatus !== EventAttendeeInviteStatus.APPROVED) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Approve this registration before marking attendance' });
      return;
    }

    const updated = await prisma.eventAttendee.update({
      where: { id: attendee.id },
      data: { inviteStatus: status },
      include: attendeeInclude,
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: `Registration status updated to ${status.toLowerCase().replace(/_/g, ' ')}`,
      data: serializeAttendee(updated),
    });
  } catch (err) {
    logger.error('Error while reviewing an event attendee', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update the event registration' });
  }
};
