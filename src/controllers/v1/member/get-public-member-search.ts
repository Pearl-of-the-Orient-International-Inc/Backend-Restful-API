import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getPublicMemberSearch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const search = (req.query.search as string | undefined)?.trim();
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit as string, 10) || 8, 1),
      20,
    );

    if (!search || search.length < 2) {
      res.status(HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Public member search retrieved successfully',
        data: [],
      });
      return;
    }

    const members = await prisma.member.findMany({
      where: {
        isActive: true,
        status: MemberStatus.APPROVED,
        uniqueId: { not: null },
        OR: [
          { uniqueId: { contains: search, mode: 'insensitive' } },
          { badgeNumber: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { middleInitial: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { extensionName: { contains: search, mode: 'insensitive' } },
          { municipalityCity: { contains: search, mode: 'insensitive' } },
          { province: { contains: search, mode: 'insensitive' } },
          { region: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          {
            preferredBranches: {
              some: { title: { contains: search, mode: 'insensitive' } },
            },
          },
          {
            officerAssignments: {
              some: {
                isActive: true,
                officeTitle: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      },
      take: limit,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        uniqueId: true,
        badgeNumber: true,
        memberType: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        extensionName: true,
        region: true,
        province: true,
        municipalityCity: true,
        user: {
          select: {
            name: true,
            avatar: true,
            isEmailVerified: true,
          },
        },
        preferredBranches: {
          select: {
            id: true,
            title: true,
          },
        },
        officerAssignments: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: {
            id: true,
            officeTitle: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public member search retrieved successfully',
      data: members,
    });
  } catch (err) {
    logger.error('Error while searching public members', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
