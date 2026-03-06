import { HTTPSTATUS } from '@/common/http-codes';
import { generateNextMemberUniqueId } from '@/lib/member-unique-id';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getCurrentIdGenerationAsset = async (
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
        user: {
          select: {
            role: true,
          },
        },
        idGenerationAsset: {
          select: {
            profileUrl: true,
            qrCodeUrl: true,
            certificateUrl: true,
            generatedAt: true,
          },
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

    let resolvedUniqueId = member.uniqueId;
    if (!resolvedUniqueId) {
      resolvedUniqueId = await generateNextMemberUniqueId(member.user.role);
      await prisma.member.update({
        where: { id: member.id },
        data: { uniqueId: resolvedUniqueId },
      });
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'ID generation asset retrieved successfully',
      data: {
        uniqueId: resolvedUniqueId,
        asset: member.idGenerationAsset,
      },
    });
  } catch (err) {
    logger.error('Error while getting ID generation asset', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
