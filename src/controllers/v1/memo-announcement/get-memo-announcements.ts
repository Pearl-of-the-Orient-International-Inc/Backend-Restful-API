import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import type { Prisma } from '@/generated/prisma/client';
import { MemoStatus, MemoTemplateType } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { memoInclude, serializeMemoAnnouncement } from './memo-announcement-shared';

export const getMemoAnnouncements = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 1000);
    const search = (req.query.search as string | undefined)?.trim();
    const category = req.query.category as MemoTemplateType | undefined;
    const status = req.query.status as MemoStatus | undefined;
    const sortBy = (req.query.sortBy as string) || 'updatedAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const skip = (page - 1) * limit;

    const orderByFieldMap: Record<string, keyof Prisma.MemoAnnouncementOrderByWithRelationInput> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      publishedAt: 'publishedAt',
      referenceNumber: 'referenceNumber',
      title: 'title',
    };

    const where: Prisma.MemoAnnouncementWhereInput = {
      ...(search
        ? {
            OR: [
              { referenceNumber: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { summary: { contains: search, mode: 'insensitive' } },
              { recipients: { some: { name: { contains: search, mode: 'insensitive' } } } },
              { recipients: { some: { email: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    };

    const [totalCount, memos] = await Promise.all([
      prisma.memoAnnouncement.count({ where }),
      prisma.memoAnnouncement.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [orderByFieldMap[sortBy] || 'updatedAt']: sortOrder,
        },
        include: memoInclude,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Memo announcements retrieved successfully',
      data: memos.map(serializeMemoAnnouncement),
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
    logger.error('Error during memo announcements retrieval', err);
  }
};
