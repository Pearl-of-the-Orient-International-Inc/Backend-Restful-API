import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { UpdateEventSchema } from '@/validators/event';
import {
  buildEventWriteInput,
  eventTaggedMemberInclude,
  serializeEvent,
} from './event-shared';

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid Event ID is required',
      });
      return;
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Event not found',
      });
      return;
    }

    const payload = req.body as UpdateEventSchema;
    const taggedMemberIds = [...new Set(payload.taggedMemberIds ?? [])];

    if (taggedMemberIds.length) {
      const members = await prisma.member.findMany({
        where: {
          id: { in: taggedMemberIds },
          isActive: true,
          status: MemberStatus.APPROVED,
        },
        select: { id: true },
      });

      if (members.length !== taggedMemberIds.length) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message: 'Tagged members must be active approved members',
        });
        return;
      }
    }

    const event = await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: buildEventWriteInput(payload),
      });

      await tx.eventTaggedMember.deleteMany({
        where: { eventId: id },
      });

      if (taggedMemberIds.length) {
        await tx.eventTaggedMember.createMany({
          data: taggedMemberIds.map((memberId) => ({
            eventId: id,
            memberId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.event.findUniqueOrThrow({
        where: { id },
        include: eventTaggedMemberInclude,
      });
    });

    logger.info('Event updated successfully', {
      eventId: event.id,
      eventName: event.name,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Event updated successfully',
      data: serializeEvent(event),
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during event update', err);
  }
};
