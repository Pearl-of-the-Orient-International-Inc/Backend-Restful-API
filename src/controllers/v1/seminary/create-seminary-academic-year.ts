import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  buildSeminaryAcademicYearData,
  ensureSingleCurrentAcademicYear,
} from './academic-year-shared';

import type { Request, Response } from 'express';
import type { CreateSeminaryAcademicYearBody } from './types';

export const createSeminaryAcademicYear = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateSeminaryAcademicYearBody;
    const academicYear = await prisma.$transaction(async (tx) => {
      const sortOrder =
        body.sortOrder ??
        ((await tx.seminaryAcademicYear.aggregate({
          _max: { sortOrder: true },
        }))._max.sortOrder ?? 0) + 1;

      const createdAcademicYear = await tx.seminaryAcademicYear.create({
        data: {
          ...buildSeminaryAcademicYearData({ ...body, sortOrder }),
          sortOrder,
        },
      });

      await ensureSingleCurrentAcademicYear(
        tx,
        createdAcademicYear.id,
        createdAcademicYear.session,
      );

      return createdAcademicYear;
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Seminary academic year created successfully',
      data: academicYear,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Academic year already exists',
      });
      return;
    }

    logger.error('Error while creating seminary academic year', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
