import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

export const deleteNewsBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid News Blog ID is required',
      });
      return;
    }

    const existingNewsBlog = await prisma.newsBlog.findUnique({
      where: { id },
    });

    if (!existingNewsBlog) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'News blog not found',
      });
      return;
    }

    await prisma.newsBlog.delete({
      where: { id },
    });

    logger.info('News blog deleted successfully', {
      newsBlogId: id,
      title: existingNewsBlog.title,
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during news blog deletion', err);
  }
};
