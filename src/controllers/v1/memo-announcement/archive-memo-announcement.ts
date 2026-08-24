import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemoStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { memoInclude, serializeMemoAnnouncement } from './memo-announcement-shared';

export const archiveMemoAnnouncement = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const memo = await prisma.memoAnnouncement.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!memo) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Memo announcement not found',
      });
      return;
    }

    if (memo.status === MemoStatus.ARCHIVED) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Memo announcement is already archived',
      });
      return;
    }

    const archivedMemo = await prisma.memoAnnouncement.update({
      where: { id: memo.id },
      data: { status: MemoStatus.ARCHIVED },
      include: memoInclude,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Memo announcement archived successfully',
      data: serializeMemoAnnouncement(archivedMemo),
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during memo announcement archive', err);
  }
};
