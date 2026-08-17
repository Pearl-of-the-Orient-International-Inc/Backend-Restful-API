import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { toGradeRecordResponse } from './grade-record-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryGradeRecordStatusBody } from './types';

export const updateSeminaryGradeRecordStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryGradeRecordStatusBody;
    const record = await prisma.seminaryGradeRecord.update({
      where: { id },
      data: { status: body.status },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Grade record status updated successfully',
      data: toGradeRecordResponse(record),
    });
  } catch (err) {
    logger.error('Error while updating seminary grade record status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
