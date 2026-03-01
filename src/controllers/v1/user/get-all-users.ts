/**
 * Custom Modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response } from 'express';



export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {


    // Parse limit and offset - undefined if not provided
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;
    const offset = req.query.offset
      ? parseInt(req.query.offset as string)
      : undefined;



    const total = await prisma.user.count();

    const users = await prisma.user.findMany({
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Build response based on whether pagination is used
    const response: any = {
      total,
      users,
    };

    // Only include pagination metadata if limit is provided
    if (limit) {
      response.limit = limit;
      response.offset = offset ?? 0;
      response.totalPages = Math.ceil(total / limit);
      response.currentPage = Math.floor((offset ?? 0) / limit) + 1;
      response.hasMore = (offset ?? 0) + limit < total;
    }

    res.status(HTTPSTATUS.OK).json(response);
  } catch (err) {
    logger.error('Error while getting all users', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      error: err,
    });
  }
};
