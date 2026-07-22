import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { defaultGradeConfiguration } from './grade-configuration-shared';

import type { Request, Response } from 'express';

export const getSeminaryGradeConfiguration = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const configuration = await prisma.seminaryGradeConfiguration.upsert({
      where: { id: 'default' },
      create: defaultGradeConfiguration,
      update: {},
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary grade configuration retrieved successfully',
      data: configuration,
    });
  } catch (err) {
    logger.error('Error while getting seminary grade configuration', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
