import { HTTPSTATUS } from '@/common/http-codes';
import { MemberOnboardingStep } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpdatePreOrientationProgressBody } from './types';

export const updatePreOrientationProgress = async (
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

    const body = req.body as UpdatePreOrientationProgressBody;
    const completedLessonIds = [...new Set(body.completedLessonIds)].sort((a, b) => a - b);
    const completedAt = body.isCompleted ? new Date() : null;

    const progress = await prisma.memberOnboardingProgress.upsert({
      where: { memberId: member.id },
      create: {
        memberId: member.id,
        currentStep: body.isCompleted
          ? MemberOnboardingStep.PAYMENT_CHECKOUT
          : MemberOnboardingStep.PRE_ORIENTATION,
        preOrientationCompletedLessonIds: completedLessonIds,
        preOrientationCompletedAt: completedAt,
      },
      update: {
        currentStep: body.isCompleted
          ? MemberOnboardingStep.PAYMENT_CHECKOUT
          : MemberOnboardingStep.PRE_ORIENTATION,
        preOrientationCompletedLessonIds: completedLessonIds,
        preOrientationCompletedAt: completedAt,
      },
      select: {
        currentStep: true,
        preOrientationCompletedLessonIds: true,
        preOrientationCompletedAt: true,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Pre-orientation progress saved successfully',
      data: progress,
    });
  } catch (err) {
    logger.error('Error while saving pre-orientation progress', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
