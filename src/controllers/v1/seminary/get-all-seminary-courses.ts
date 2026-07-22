import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { GetAllSeminaryCoursesQuery } from './types';

export const getAllSeminaryCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAllSeminaryCoursesQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(
      Math.max(Number.parseInt(query.limit ?? '10', 10), 1),
      100,
    );
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.SeminaryCourseWhereInput = {
      ...(query.program ? { program: query.program } : {}),
      ...(query.modality ? { modality: query.modality } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { courseName: { contains: search, mode: 'insensitive' } },
              { courseCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [courses, total] = await prisma.$transaction([
      prisma.seminaryCourse.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { courseName: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.seminaryCourse.count({ where }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary courses retrieved successfully',
      data: courses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('Error while getting seminary courses', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
