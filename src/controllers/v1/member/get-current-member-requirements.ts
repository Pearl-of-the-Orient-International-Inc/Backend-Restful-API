import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { requirementTypeToKey } from '@/lib/member-requirements';

import type { Request, Response } from 'express';

export const getCurrentMemberRequirements = async (
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
        applicantRequirements: {
          select: {
            type: true,
            fileUrl: true,
            fileName: true,
            mimeType: true,
            reviewStatus: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member application not found',
      });
      return;
    }

    const attachments = member.applicantRequirements.reduce<Record<string, string>>(
      (acc, item) => {
        acc[requirementTypeToKey[item.type]] = item.fileUrl;
        return acc;
      },
      {},
    );

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member requirements retrieved successfully',
      data: {
        memberId: member.id,
        uniqueId: member.uniqueId,
        attachments,
        requirements: member.applicantRequirements,
      },
    });
  } catch (err) {
    logger.error('Error while getting current member requirements', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
