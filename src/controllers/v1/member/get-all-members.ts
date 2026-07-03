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

export const getAllMembers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const all = (req.query.all as string) === 'true';
    const page = all ? 1 : parseInt(req.query.page as string) || 1;
    const limit = all ? undefined : parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || undefined;
    const status = req.query.status as MemberStatus | undefined;
    const includeArchived = (req.query.includeArchived as string) === 'true';
    const skip = limit ? (page - 1) * limit : undefined;

    const where = {
      ...(status ? { status } : {}),
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
      ...(skip !== undefined ? { skip } : {}),
      ...(limit !== undefined ? { take: limit } : {}),
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

    const totalPages = limit ? Math.ceil(totalCount / limit) : 1;

    logger.info('Members retrieved', {
      count: members.length,
      totalCount,
      page,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Members retrieved successfully',
      data: members,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit: limit ?? totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    logger.error('Error while getting members', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
