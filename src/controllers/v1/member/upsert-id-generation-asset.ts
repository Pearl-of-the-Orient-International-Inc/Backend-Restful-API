import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { generateNextMemberUniqueId } from '@/lib/member-unique-id';

import type { Request, Response } from 'express';
import type { UpsertMemberIdGenerationAssetBody } from './types';

export const upsertIdGenerationAsset = async (
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
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member application not found',
      });
      return;
    }

    const body = req.body as UpsertMemberIdGenerationAssetBody;

    let nextUniqueId = member.uniqueId;
    if (!nextUniqueId) {
      nextUniqueId = await generateNextMemberUniqueId(member.user.role);
    }

    const [updatedMember, asset] = await prisma.$transaction([
      prisma.member.update({
        where: { id: member.id },
        data: { uniqueId: nextUniqueId },
        select: { uniqueId: true },
      }),
      prisma.memberIdGenerationAsset.upsert({
        where: { memberId: member.id },
        create: {
          memberId: member.id,
          profileUrl: body.profileUrl,
          qrCodeUrl: body.qrCodeUrl,
          generatedAt: new Date(),
        },
        update: {
          profileUrl: body.profileUrl,
          qrCodeUrl: body.qrCodeUrl,
          generatedAt: new Date(),
        },
        select: {
          profileUrl: true,
          qrCodeUrl: true,
          generatedAt: true,
        },
      }),
    ]);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'ID generation asset saved successfully',
      data: {
        uniqueId: updatedMember.uniqueId,
        asset,
      },
    });
  } catch (err) {
    logger.error('Error while saving ID generation asset', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
