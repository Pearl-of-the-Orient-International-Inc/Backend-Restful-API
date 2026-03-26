import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getMemberById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = req.params.id;

    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid member ID',
      });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        ministerialExperiences: {
          orderBy: { order: 'asc' },
        },
        characterReferences: {
          orderBy: { order: 'asc' },
        },
        preferredBranches: {
          select: { id: true, title: true },
        },
        signature: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    logger.info('Member retrieved by admin', { memberId });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member retrieved successfully',
      data: member,
    });
  } catch (err) {
    logger.error('Error while getting member by id', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
