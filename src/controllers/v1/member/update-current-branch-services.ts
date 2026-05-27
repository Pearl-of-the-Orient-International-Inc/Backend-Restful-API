import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

const normalizeBranchOther = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const updateCurrentBranchServices = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { userId },
      select: {
        id: true,
        uniqueId: true,
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member application not found',
      });
      return;
    }

    const { preferredBranchOther } = req.body as {
      preferredBranchOther?: string;
    };

    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: {
        preferredBranchOther: normalizeBranchOther(preferredBranchOther),
      },
      select: {
        id: true,
        uniqueId: true,
        preferredBranchOther: true,
        preferredBranches: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Branch services updated successfully',
      data: updatedMember,
    });
  } catch (err) {
    logger.error('Error while updating current branch services', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
