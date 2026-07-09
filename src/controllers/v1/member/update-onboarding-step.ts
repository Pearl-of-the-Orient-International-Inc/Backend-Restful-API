import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpdateOnboardingStepBody } from './types';

export const updateOnboardingStep = async (
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

    const body = req.body as UpdateOnboardingStepBody;

    const progress = await prisma.memberOnboardingProgress.upsert({
      where: { memberId: member.id },
      create: {
        memberId: member.id,
        currentStep: body.currentStep,
      },
      update: {
        currentStep: body.currentStep,
      },
      select: {
        currentStep: true,
        preOrientationCompletedLessonIds: true,
        preOrientationCompletedAt: true,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Onboarding step updated successfully',
      data: progress,
    });
  } catch (err) {
    logger.error('Error while updating onboarding step', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
