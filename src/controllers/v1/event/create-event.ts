import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { CreateEventSchema } from '@/validators/event';
import {
  buildEventWriteInput,
  eventTaggedMemberInclude,
  serializeEvent,
} from './event-shared';

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  const payload = req.body as CreateEventSchema;

  try {
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

    const event = await prisma.event.create({
      data: {
        ...buildEventWriteInput(payload),
        ...(taggedMemberIds.length
          ? {
              taggedMembers: {
                createMany: {
                  data: taggedMemberIds.map((memberId) => ({ memberId })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
      include: eventTaggedMemberInclude,
    });

    logger.info('Event created successfully', {
      eventId: event.id,
      eventName: event.name,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Event created successfully',
      data: serializeEvent(event),
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during event creation', err);
  }
};
