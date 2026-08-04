import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import { toInstructorResponse } from './instructor-shared';

export const getSeminaryInstructorById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const instructor = await prisma.seminaryInstructor.findUnique({
      where: { id },
    });

    if (!instructor) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary instructor not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary instructor retrieved successfully',
      data: toInstructorResponse(instructor),
    });
  } catch (err) {
    logger.error('Error while getting seminary instructor by id', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
