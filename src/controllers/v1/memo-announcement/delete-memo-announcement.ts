import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

export const deleteMemoAnnouncement = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const memo = await prisma.memoAnnouncement.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!memo) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Memo announcement not found',
      });
      return;
    }

    await prisma.memoAnnouncement.delete({ where: { id: memo.id } });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Memo announcement deleted successfully',
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during memo announcement deletion', err);
  }
};
