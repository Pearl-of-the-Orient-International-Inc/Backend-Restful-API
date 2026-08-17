import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  getGradeRecordWhereForUser,
  toGradeRecordResponse,
} from './grade-record-shared';

import type { Request, Response } from 'express';
import type { GetSeminaryGradeRecordParams } from './types';

export const getSeminaryGradeRecord = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params as GetSeminaryGradeRecordParams;
    const userWhere = await getGradeRecordWhereForUser(req.userId);

    const record = await prisma.seminaryGradeRecord.findFirst({
      where: { id, ...userWhere },
    });

    if (!record) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Grade record not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Grade record retrieved successfully',
      data: toGradeRecordResponse(record),
    });
  } catch (err) {
    logger.error('Error while getting seminary grade record', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
