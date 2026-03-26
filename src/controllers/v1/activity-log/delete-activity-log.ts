import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

export const deleteActivityLog = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid activity log ID',
      });
      return;
    }

    const existingLog = await prisma.activityLog.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingLog) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Activity log not found',
      });
      return;
    }

    await prisma.activityLog.delete({
      where: { id },
    });

    res.sendStatus(HTTPSTATUS.NO_CONTENT);
  } catch (err) {
    logger.error('Error while deleting activity log', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
