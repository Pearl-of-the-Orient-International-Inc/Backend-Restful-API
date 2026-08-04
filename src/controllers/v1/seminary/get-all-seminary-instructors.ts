import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { GetAllSeminaryInstructorsQuery } from './types';
import { toInstructorResponse } from './instructor-shared';

export const getAllSeminaryInstructors = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAllSeminaryInstructorsQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const limit = query.limit
      ? Math.min(Math.max(Number.parseInt(query.limit, 10), 1), 500)
      : undefined;
    const skip = limit ? (page - 1) * limit : undefined;
    const search = query.search?.trim();

    const where: Prisma.SeminaryInstructorWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.teachingProgram
        ? { teachingPrograms: { has: query.teachingProgram } }
        : {}),
      ...(search
        ? {
            OR: [
              { facultyId: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { professionalTitle: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [instructors, total] = await prisma.$transaction([
      prisma.seminaryInstructor.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
        ...(skip === undefined ? {} : { skip }),
        ...(limit === undefined ? {} : { take: limit }),
      }),
      prisma.seminaryInstructor.count({ where }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary instructors retrieved successfully',
      data: instructors.map(toInstructorResponse),
      meta: {
        page,
        limit: limit ?? total,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (err) {
    logger.error('Error while getting seminary instructors', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
