/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';

export const getAllOffices = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Optional query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const orderByFieldMap: Record<string, 'createdAt' | 'updatedAt' | 'name'> =
      {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        title: 'name',
      };
    const orderByField = orderByFieldMap[sortBy] || 'createdAt';

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build where clause for search
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

    // Get total count for pagination
    const totalCount = await prisma.officeTitle.count({ where });

    // Fetch offices with pagination
    const offices = await prisma.officeTitle.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [orderByField]: sortOrder,
      },
    });

    const officePayload = offices.map((office) => {
      const { name, ...rest } = office;
      return {
        ...rest,
        title: name,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    logger.info('Offices retrieved successfully', {
      count: offices.length,
      page,
      totalCount,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Offices retrieved successfully',
      data: officePayload,
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
    logger.error('Error during retrieval of offices', err);
  }
};
