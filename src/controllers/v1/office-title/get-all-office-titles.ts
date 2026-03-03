/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response } from 'express';

export const getAllOfficeTitles = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const orderByFieldMap: Record<
      string,
      'createdAt' | 'updatedAt' | 'name' | 'level'
    > = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      name: 'name',
      title: 'name',
      level: 'level',
    };
    const orderByField = orderByFieldMap[sortBy] || 'createdAt';
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const totalCount = await prisma.officeTitle.count({ where });
    const officeTitles = await prisma.officeTitle.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [orderByField]: sortOrder,
      },
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    logger.info('Office titles retrieved successfully', {
      count: officeTitles.length,
      page,
      totalCount,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Office titles retrieved successfully',
      data: officeTitles,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during retrieval of office titles', err);
  }
};
