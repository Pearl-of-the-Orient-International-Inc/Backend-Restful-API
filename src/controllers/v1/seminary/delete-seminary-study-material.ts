import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const deleteSeminaryStudyMaterial = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const material = await prisma.seminaryStudyMaterial.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!material) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Study material not found',
      });
      return;
    }

    await prisma.seminaryStudyMaterial.delete({ where: { id } });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Study material deleted successfully',
    });
  } catch (err) {
    logger.error('Error while deleting seminary study material', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
