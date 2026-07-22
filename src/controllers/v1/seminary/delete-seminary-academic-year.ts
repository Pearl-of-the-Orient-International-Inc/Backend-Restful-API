import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const deleteSeminaryAcademicYear = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
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

    await prisma.seminaryAcademicYear.delete({ where: { id } });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary academic year deleted successfully',
    });
  } catch (err) {
    logger.error('Error while deleting seminary academic year', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
