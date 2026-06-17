/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { MemberStatus } from '@/generated/prisma/enums';

/**
 * Types
 */
import type { Request, Response } from 'express';

export const getPendingMembers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const includeArchived = (req.query.includeArchived as string) === 'true';
    const skip = (page - 1) * limit;

    const where = {
      status: MemberStatus.PENDING,
      ...(includeArchived ? {} : { isActive: true }),
      ...(search
        ? {
            OR: [
              {
                firstName: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                lastName: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                user: {
                  email: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const totalCount = await prisma.member.count({ where });

    const members = await prisma.member.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            isEmailVerified: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    logger.info('Pending members retrieved', {
      count: members.length,
      totalCount,
      page,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Pending members retrieved successfully',
      data: members,
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
    logger.error('Error while getting pending members', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
