import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  buildGradeConfigurationCreateData,
  buildGradeConfigurationUpdateData,
} from './grade-configuration-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryGradeConfigurationBody } from './types';

export const updateSeminaryGradeConfiguration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as UpdateSeminaryGradeConfigurationBody;
    const configuration = await prisma.seminaryGradeConfiguration.upsert({
      where: { id: 'default' },
      create: buildGradeConfigurationCreateData(body),
      update: buildGradeConfigurationUpdateData(body),
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary grade configuration updated successfully',
      data: configuration,
    });
  } catch (err) {
    logger.error('Error while updating seminary grade configuration', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
