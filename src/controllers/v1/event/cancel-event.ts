import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { EventStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { serializeEvent } from './event-shared';

export const cancelEvent = async (req: Request, res: Response): Promise<void> => {
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

    const event = await prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.CANCELLED,
      },
    });

    logger.info('Event cancelled successfully', {
      eventId: event.id,
      eventName: event.name,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Event cancelled successfully',
      data: serializeEvent(event),
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during event cancellation', err);
  }
};
