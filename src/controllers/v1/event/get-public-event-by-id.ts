import type { Request, Response } from 'express';

import { HTTPSTATUS } from '@/common/http-codes';
import { EventStatus, EventVisibility } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { eventTaggedMemberInclude, serializePublicEvent } from './event-shared';

export const getPublicEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'A valid event ID is required' });
      return;
    }

    const event = await prisma.event.findFirst({
      where: { id, visibility: EventVisibility.PUBLIC, status: { not: EventStatus.CANCELLED } },
      include: eventTaggedMemberInclude,
    });
    if (!event) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Public event not found' });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public event retrieved successfully',
      data: serializePublicEvent(event),
    });
  } catch (err) {
    logger.error('Error retrieving public event', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to retrieve this event' });
  }
};
