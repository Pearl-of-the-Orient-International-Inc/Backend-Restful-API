import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import {
  EventCategory,
  EventStatus,
  EventType,
  EventVisibility,
} from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { eventTaggedMemberInclude, serializeEvent } from './event-shared';

export const getPublicEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string | undefined)?.trim();
    const category = req.query.category as EventCategory | undefined;
    const type = req.query.type as EventType | undefined;
    const sortBy = (req.query.sortBy as string) || 'startsAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const skip = (page - 1) * limit;

    const orderByFieldMap: Record<
      string,
      'createdAt' | 'updatedAt' | 'startsAt' | 'name'
    > = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      startsAt: 'startsAt',
      name: 'name',
    };
    const orderByField = orderByFieldMap[sortBy] || 'startsAt';

    const where: Prisma.EventWhereInput = {
      visibility: EventVisibility.PUBLIC,
      status: {
        not: EventStatus.CANCELLED,
      },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
              { organizer: { contains: search, mode: 'insensitive' as const } },
              { location: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(type ? { type } : {}),
    };

    const [totalCount, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [orderByField]: sortOrder,
        },
        include: eventTaggedMemberInclude,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    logger.info('Public events retrieved successfully', {
      count: events.length,
      page,
      totalCount,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public events retrieved successfully',
      data: events.map(serializeEvent),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during public events retrieval', err);
  }
};
