import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { newsBlogInclude, serializeNewsBlog } from './news-blog-shared';

export const archiveNewsBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const newsBlogId = req.params.id;

    if (!newsBlogId || Array.isArray(newsBlogId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid news blog ID',
      });
      return;
    }

    const existingNewsBlog = (await prisma.newsBlog.findUnique({
      where: { id: newsBlogId },
      select: { id: true, isActive: true } as never,
    } as never)) as { id: string; isActive: boolean } | null;

    if (!existingNewsBlog) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'News blog not found',
      });
      return;
    }

    if (!existingNewsBlog.isActive) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'News blog is already archived',
      });
      return;
    }

    const archivedNewsBlog = await prisma.newsBlog.update({
      where: { id: newsBlogId },
      data: { isActive: false } as never,
      include: newsBlogInclude,
    } as never);

    logger.info('News blog archived successfully', { newsBlogId });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'News blog archived successfully',
      data: serializeNewsBlog(archivedNewsBlog),
    });
  } catch (err) {
    logger.error('Error during news blog archive', err);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
