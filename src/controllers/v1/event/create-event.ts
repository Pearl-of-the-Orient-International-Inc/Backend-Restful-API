import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { CreateEventSchema } from '@/validators/event';
import { buildEventWriteInput, serializeEvent } from './event-shared';

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  const payload = req.body as CreateEventSchema;

  try {
    const event = await prisma.event.create({
      data: buildEventWriteInput(payload),
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
