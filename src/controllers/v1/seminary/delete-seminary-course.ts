import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const deleteSeminaryCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existingCourse = await prisma.seminaryCourse.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingCourse) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary course not found',
      });
      return;
    }

    await prisma.seminaryCourse.delete({ where: { id } });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary course deleted successfully',
    });
  } catch (err) {
    logger.error('Error while deleting seminary course', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
