import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { newsBlogInclude, serializeNewsBlog } from './news-blog-shared';

export const getNewsBlogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid News Blog ID is required',
      });
      return;
    }

    const newsBlog = await prisma.newsBlog.findUnique({
      where: { id },
      include: newsBlogInclude,
    });

    if (!newsBlog) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'News blog not found',
      });
      return;
    }

    logger.info('News blog retrieved successfully', {
      newsBlogId: newsBlog.id,
      title: newsBlog.title,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'News blog retrieved successfully',
      data: serializeNewsBlog(newsBlog),
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during news blog retrieval', err);
  }
};
