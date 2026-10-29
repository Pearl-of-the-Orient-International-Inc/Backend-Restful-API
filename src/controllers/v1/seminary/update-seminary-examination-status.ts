import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { canManageExamination, toExaminationResponse } from './examination-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryExaminationStatusBody } from './types';

export const updateSeminaryExaminationStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryExaminationStatusBody;
    if (!(await canManageExamination({ examinationId: id, userId: req.userId, res }))) return;
    const examination = await prisma.seminaryExamination.update({
      where: { id },
      data: { status: body.status },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Examination status updated successfully',
      data: toExaminationResponse(examination),
    });
  } catch (err) {
    logger.error('Error while updating seminary examination status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
