import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryApplicationInclude } from './seminary-shared';

import type { Request, Response } from 'express';
import type { GetAllSeminaryApplicationsQuery } from './types';

export const getAllSeminaryApplications = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAllSeminaryApplicationsQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const hasLimit = typeof query.limit === 'string';
    const limit = hasLimit
      ? Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10), 1), 100)
      : undefined;
    const skip = limit ? (page - 1) * limit : undefined;
    const search = query.search?.trim();

    const where: Prisma.SeminaryApplicationWhereInput = {
      status: query.status,
      ...(search
        ? {
            OR: [
              { surname: { contains: search, mode: 'insensitive' } },
              { givenName: { contains: search, mode: 'insensitive' } },
              { emailAddress: { contains: search, mode: 'insensitive' } },
              { programCourse: { contains: search, mode: 'insensitive' } },
              {
                member: {
                  user: {
                    email: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [applications, total] = await prisma.$transaction([
      prisma.seminaryApplication.findMany({
        where,
        include: seminaryApplicationInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.seminaryApplication.count({ where }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary applications retrieved successfully',
      data: applications,
      meta: {
        page,
        limit: limit ?? total,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (err) {
    logger.error('Error while getting seminary applications', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
