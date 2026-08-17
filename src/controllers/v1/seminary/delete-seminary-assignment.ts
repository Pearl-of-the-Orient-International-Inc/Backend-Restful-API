import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const deleteSeminaryAssignment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
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
