import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { canManageExamination } from './examination-shared';

import type { Request, Response } from 'express';

export const deleteSeminaryExamination = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!(await canManageExamination({ examinationId: id, userId: req.userId, res }))) return;
    await prisma.seminaryExamination.delete({ where: { id } });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Examination deleted successfully',
    });
  } catch (err) {
    logger.error('Error while deleting seminary examination', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
