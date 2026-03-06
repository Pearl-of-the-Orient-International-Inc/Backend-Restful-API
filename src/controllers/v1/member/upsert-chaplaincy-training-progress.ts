import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpsertChaplaincyTrainingProgressBody } from './types';

export const upsertChaplaincyTrainingProgress = async (
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
      select: { id: true },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member application not found',
      });
      return;
    }

    const body = req.body as UpsertChaplaincyTrainingProgressBody;
    const completedLessonIds = [...new Set(body.completedLessonIds)].sort((a, b) => a - b);
    const completedAt = body.isCompleted ? new Date() : null;

    const cleanedEssayAnswers: Record<string, string> = {};
    if (body.essayAnswers && typeof body.essayAnswers === 'object') {
      for (const [key, value] of Object.entries(body.essayAnswers)) {
        const trimmedValue = value.trim();
        if (trimmedValue) {
          cleanedEssayAnswers[key] = trimmedValue;
        }
      }
    }

    const progress = await prisma.memberChaplaincyTrainingProgress.upsert({
      where: { memberId: member.id },
      create: {
        memberId: member.id,
        completedLessonIds,
        essayAnswers: cleanedEssayAnswers,
        completedAt,
      },
      update: {
        completedLessonIds,
        essayAnswers: cleanedEssayAnswers,
        completedAt,
      },
      select: {
        completedLessonIds: true,
        essayAnswers: true,
        completedAt: true,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Chaplaincy training progress saved successfully',
      data: progress,
    });
  } catch (err) {
    logger.error('Error while saving chaplaincy training progress', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
