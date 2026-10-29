import { HTTPSTATUS } from '@/common/http-codes';
import { UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const deleteSeminaryStudyMaterial = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!req.userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const [material, user] = await Promise.all([
      prisma.seminaryStudyMaterial.findUnique({
        where: { id },
        select: { id: true, uploadedByUserId: true },
      }),
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { role: true },
      }),
    ]);

    if (!material) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Study material not found',
      });
      return;
    }

    if (
      !user ||
      (user.role === UserType.INSTRUCTOR && material.uploadedByUserId !== req.userId)
    ) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'You can manage only study materials you uploaded',
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
