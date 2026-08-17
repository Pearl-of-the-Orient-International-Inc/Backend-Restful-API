import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  getExaminationWhereForUser,
  toExaminationResponse,
} from './examination-shared';

import type { Request, Response } from 'express';

export const getSeminaryExaminationById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userWhere = await getExaminationWhereForUser(req.userId);
    const examination = await prisma.seminaryExamination.findFirst({
      where: { ...userWhere, id },
    });

    if (!examination) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Examination not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Examination retrieved successfully',
      data: toExaminationResponse(examination),
    });
  } catch (err) {
    logger.error('Error while getting seminary examination by id', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
