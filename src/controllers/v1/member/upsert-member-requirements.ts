import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { ApplicantRequirementType } from '@/generated/prisma/enums';
import { requirementTypeToKey } from '@/lib/member-requirements';

import type { Request, Response } from 'express';
import type { UpsertMemberRequirementsBody } from './types';

export const upsertMemberRequirements = async (
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
        applicantRequirements: {
          select: { type: true },
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

    const body = req.body as UpsertMemberRequirementsBody;

    const dedupedByType = new Map(body.attachments.map((attachment) => [attachment.type, attachment]));

    const typeSet = new Set<ApplicantRequirementType>(member.applicantRequirements.map((item) => item.type));
    for (const type of dedupedByType.keys()) {
      typeSet.add(type);
    }

    if (!typeSet.has(ApplicantRequirementType.PHOTO_2X2)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: '2x2 picture is required',
      });
      return;
    }

    const upsertPayload = [...dedupedByType.values()];

    await prisma.$transaction(
      upsertPayload.map((attachment) =>
        prisma.applicantRequirement.upsert({
          where: {
            memberId_type: {
              memberId: member.id,
              type: attachment.type,
            },
          },
          create: {
            memberId: member.id,
            type: attachment.type,
            fileUrl: attachment.fileUrl,
            fileName: attachment.fileName ?? null,
            mimeType: attachment.mimeType ?? null,
          },
          update: {
            fileUrl: attachment.fileUrl,
            fileName: attachment.fileName ?? null,
            mimeType: attachment.mimeType ?? null,
          },
        }),
      ),
    );

    const requirements = await prisma.applicantRequirement.findMany({
      where: { memberId: member.id },
      select: {
        type: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        reviewStatus: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const attachments = requirements.reduce<Record<string, string>>((acc, item) => {
      acc[requirementTypeToKey[item.type]] = item.fileUrl;
      return acc;
    }, {});

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member requirements saved successfully',
      data: {
        memberId: member.id,
        attachments,
        requirements,
      },
    });
  } catch (err) {
    logger.error('Error while saving member requirements', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
