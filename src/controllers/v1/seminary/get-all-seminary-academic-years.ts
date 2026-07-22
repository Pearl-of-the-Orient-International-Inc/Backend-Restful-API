import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { GetAllSeminaryAcademicYearsQuery } from './types';

export const getAllSeminaryAcademicYears = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const query = req.query as GetAllSeminaryAcademicYearsQuery;
    const page = Math.max(Number.parseInt(query.page ?? '1', 10), 1);
    const limit = Math.min(
      Math.max(Number.parseInt(query.limit ?? '10', 10), 1),
      100,
    );
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.SeminaryAcademicYearWhereInput = {
      ...(query.session ? { session: query.session } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? { academicYear: { contains: search, mode: 'insensitive' } }
        : {}),
    };

    const [academicYears, total] = await prisma.$transaction([
      prisma.seminaryAcademicYear.findMany({
        where,
        orderBy: [{ startDate: 'desc' }, { sortOrder: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.seminaryAcademicYear.count({ where }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary academic years retrieved successfully',
      data: academicYears,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('Error while getting seminary academic years', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
