import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const createCurrentMemberPublicRecord = async (
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

    const {
      title,
      shortDescription,
      type,
      eventAt,
      location,
      status,
      attachments = [],
    } =
      req.body as {
        title: string;
        shortDescription: string;
        type:
          | 'REPORT_ACTIVITY'
          | 'COMMUNITY_SERVICE'
          | 'TRAINING_CONDUCTED'
          | 'PARTICIPATION'
          | 'RECOGNITION';
        eventAt: string;
        location: string;
        status: 'PUBLISHED' | 'DRAFT';
        attachments?: Array<{
          fileUrl: string;
          fileName?: string;
          mimeType?: string;
        }>;
      };

    const record = await prisma.memberPublicRecord.create({
      data: {
        memberId: member.id,
        title,
        shortDescription,
        type,
        eventAt: new Date(eventAt),
        location,
        status,
        attachments: attachments.length
          ? {
              create: attachments.map((attachment, index) => ({
                fileUrl: attachment.fileUrl,
                fileName: attachment.fileName,
                mimeType: attachment.mimeType,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        type: true,
        eventAt: true,
        location: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        attachments: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            mimeType: true,
            sortOrder: true,
            createdAt: true,
          },
        },
      },
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Public record created successfully',
      data: record,
    });
  } catch (err) {
    logger.error('Error while creating current member public record', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
