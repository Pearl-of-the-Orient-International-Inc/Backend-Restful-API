import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { memoInclude, serializeMemoAnnouncement } from './memo-announcement-shared';

export const getMemoAnnouncementById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const memo = await prisma.memoAnnouncement.findUnique({
      where: { id },
      include: memoInclude,
    }) as any;

    if (!memo) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Memo announcement not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Memo announcement retrieved successfully',
      data: serializeMemoAnnouncement(memo),
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during memo announcement retrieval', err);
  }
};
