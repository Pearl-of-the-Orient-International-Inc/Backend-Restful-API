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
    const limit = Math.min(
      Math.max(Number.parseInt(query.limit ?? '10', 10), 1),
      100,
    );
    const skip = (page - 1) * limit;
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
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
