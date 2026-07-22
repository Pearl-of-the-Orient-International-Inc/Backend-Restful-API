import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { ensureSingleCurrentAcademicYear } from './academic-year-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryAcademicYearSessionBody } from './types';

export const updateSeminaryAcademicYearSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryAcademicYearSessionBody;

    const academicYear = await prisma.$transaction(async (tx) => {
      const existingAcademicYear = await tx.seminaryAcademicYear.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingAcademicYear) return null;

      const updatedAcademicYear = await tx.seminaryAcademicYear.update({
        where: { id },
        data: { session: body.session },
      });

      await ensureSingleCurrentAcademicYear(
        tx,
        updatedAcademicYear.id,
        updatedAcademicYear.session,
      );

      return updatedAcademicYear;
    });

    if (!academicYear) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary academic year not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary academic year session updated successfully',
      data: academicYear,
    });
  } catch (err) {
    logger.error('Error while updating seminary academic year session', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
