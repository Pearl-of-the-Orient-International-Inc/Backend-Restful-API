import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { defaultFeeConfiguration } from './fee-configuration-shared';

import type { Request, Response } from 'express';

export const getSeminaryFeeConfiguration = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const configuration = await prisma.seminaryFeeConfiguration.upsert({
      where: { id: 'default' },
      create: defaultFeeConfiguration,
      update: {},
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary fee configuration retrieved successfully',
      data: configuration,
    });
  } catch (err) {
    logger.error('Error while getting seminary fee configuration', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
