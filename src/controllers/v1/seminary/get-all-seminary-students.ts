import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryApplicationInclude } from './seminary-shared';

import type { Request, Response } from 'express';
import type { GetAllSeminaryStudentsQuery } from './types';

export const getAllSeminaryStudents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAllSeminaryStudentsQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const hasLimit = typeof query.limit === 'string';
    const limit = hasLimit
      ? Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10), 1), 100)
      : undefined;
    const skip = limit ? (page - 1) * limit : undefined;
    const search = query.search?.trim();

    const where: Prisma.SeminaryApplicationWhereInput = {
      studentId: { not: null },
      ...(query.programLevel ? { programLevel: query.programLevel } : {}),
      ...(query.studentStatus ? { studentStatus: query.studentStatus } : {}),
      ...(query.schoolAffiliation
        ? { schoolAffiliation: query.schoolAffiliation }
        : {}),
      ...(query.academicYear ? { academicYear: query.academicYear } : {}),
      ...(search
        ? {
            OR: [
              { studentId: { contains: search, mode: 'insensitive' } },
              { surname: { contains: search, mode: 'insensitive' } },
              { givenName: { contains: search, mode: 'insensitive' } },
              { emailAddress: { contains: search, mode: 'insensitive' } },
              { mobilePhone: { contains: search, mode: 'insensitive' } },
              { programCourse: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [students, total] = await prisma.$transaction([
      prisma.seminaryApplication.findMany({
        where,
        include: seminaryApplicationInclude,
        orderBy: { studentId: 'asc' },
        skip,
        take: limit,
      }),
      prisma.seminaryApplication.count({ where }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary students retrieved successfully',
      data: students,
      meta: {
        page,
        limit: limit ?? total,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (err) {
    logger.error('Error while getting seminary students', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
