import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const deleteSeminaryInstructor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const instructor = await prisma.seminaryInstructor.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!instructor) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary instructor not found',
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.seminaryInstructor.delete({ where: { id } });

      if (instructor.userId) {
        await tx.user.delete({ where: { id: instructor.userId } });
      }
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary instructor deleted successfully',
    });
  } catch (err) {
    logger.error('Error while deleting seminary instructor', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
