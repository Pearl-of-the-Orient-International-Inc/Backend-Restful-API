import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { seminaryApplicationInclude } from './seminary-shared';

import type { Request, Response } from 'express';

export const getSeminaryApplicationById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const applicationId = String(req.params.id);
    const application = await prisma.seminaryApplication.findUnique({
      where: { id: applicationId },
      include: seminaryApplicationInclude,
    });

    if (!application) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary application not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary application retrieved successfully',
      data: application,
    });
  } catch (err) {
    logger.error('Error while getting seminary application by id', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
