import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { NewsBlogStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { newsBlogInclude, serializeNewsBlog } from './news-blog-shared';

export const getPublicNewsBlogById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid News Blog ID is required',
      });
      return;
    }

    const newsBlog = await prisma.newsBlog.findFirst({
      where: {
        id,
        status: NewsBlogStatus.PUBLISHED,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
      include: newsBlogInclude,
    });

    if (!newsBlog) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'News blog not found',
      });
      return;
    }

    logger.info('Public news blog retrieved successfully', {
      newsBlogId: newsBlog.id,
      title: newsBlog.title,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public news blog retrieved successfully',
      data: serializeNewsBlog(newsBlog),
    });
  } catch (err) {
    logger.error('Error during public news blog retrieval', err);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
