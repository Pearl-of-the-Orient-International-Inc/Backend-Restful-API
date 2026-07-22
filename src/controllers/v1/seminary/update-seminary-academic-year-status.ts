import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpdateSeminaryAcademicYearStatusBody } from './types';

export const updateSeminaryAcademicYearStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryAcademicYearStatusBody;

    const existingAcademicYear = await prisma.seminaryAcademicYear.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingAcademicYear) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary academic year not found',
      });
      return;
    }

    const academicYear = await prisma.seminaryAcademicYear.update({
      where: { id },
      data: { status: body.status },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary academic year status updated successfully',
      data: academicYear,
    });
  } catch (err) {
    logger.error('Error while updating seminary academic year status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
