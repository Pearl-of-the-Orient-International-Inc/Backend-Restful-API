import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const deleteSeminaryStudent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const studentId = String(req.params.studentId);

    const student = await prisma.seminaryApplication.findUnique({
      where: { studentId },
      select: { id: true },
    });

    if (!student) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary student not found',
      });
      return;
    }

    await prisma.seminaryApplication.delete({
      where: { studentId },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary student deleted successfully',
    });
  } catch (err) {
    logger.error('Error while deleting seminary student', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
