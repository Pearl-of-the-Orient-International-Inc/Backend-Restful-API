import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { NewsBlogStatus } from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { newsBlogInclude, serializeNewsBlog } from './news-blog-shared';

export const getAllNewsBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const search = (req.query.search as string | undefined)?.trim();
    const status = req.query.status as NewsBlogStatus | undefined;
    const sortBy = (req.query.sortBy as string) || 'updatedAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const skip = (page - 1) * limit;

    const orderByFieldMap: Record<string, 'createdAt' | 'updatedAt' | 'scheduledAt' | 'title'> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      scheduledAt: 'scheduledAt',
      title: 'title',
    };
    const orderByField = orderByFieldMap[sortBy] || 'updatedAt';

    const where: Prisma.NewsBlogWhereInput = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { caption: { contains: search, mode: 'insensitive' as const } },
              { hashtags: { hasSome: [search, `#${search.replace(/^#/, '')}`] } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    };

    const [totalCount, newsBlogs] = await Promise.all([
      prisma.newsBlog.count({ where }),
      prisma.newsBlog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [orderByField]: sortOrder,
        },
        include: newsBlogInclude,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    logger.info('News blogs retrieved successfully', {
      count: newsBlogs.length,
      page,
      totalCount,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'News blogs retrieved successfully',
      data: newsBlogs.map(serializeNewsBlog),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during news blogs retrieval', err);
  }
};
