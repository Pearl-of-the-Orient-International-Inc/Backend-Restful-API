import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { NewsBlogStatus } from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { newsBlogInclude, serializeNewsBlog } from './news-blog-shared';

export const getPublicNewsBlogs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const search = (req.query.search as string | undefined)?.trim();
    const skip = (page - 1) * limit;

    const where: Prisma.NewsBlogWhereInput = {
      status: NewsBlogStatus.PUBLISHED,
      OR: [
        { publishedAt: null },
        { publishedAt: { lte: new Date() } },
      ],
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { title: { contains: search, mode: 'insensitive' as const } },
                  { caption: { contains: search, mode: 'insensitive' as const } },
                  {
                    hashtags: {
                      hasSome: [search, `#${search.replace(/^#/, '')}`],
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    };

    const [totalCount, newsBlogs] = await Promise.all([
      prisma.newsBlog.count({ where }),
      prisma.newsBlog.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: newsBlogInclude,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    logger.info('Public news blogs retrieved successfully', {
      count: newsBlogs.length,
      page,
      totalCount,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public news blogs retrieved successfully',
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
    logger.error('Error during public news blogs retrieval', err);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
