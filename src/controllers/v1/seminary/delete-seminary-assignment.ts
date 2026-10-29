import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { canManageAssignment } from './assignment-shared';

import type { Request, Response } from 'express';

export const deleteSeminaryAssignment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!(await canManageAssignment({ assignmentId: id, userId: req.userId, res }))) return;
    await prisma.seminaryAssignment.delete({ where: { id } });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Assignment deleted successfully',
    });
  } catch (err) {
    logger.error('Error while deleting seminary assignment', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
