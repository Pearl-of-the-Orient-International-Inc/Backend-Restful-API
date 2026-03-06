import { HTTPSTATUS } from '@/common/http-codes';
import { MemberOnboardingStep } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getCurrentOnboardingProgress = async (
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

    const progress = await prisma.memberOnboardingProgress.findUnique({
      where: { memberId: member.id },
      select: {
        currentStep: true,
        preOrientationCompletedLessonIds: true,
        preOrientationCompletedAt: true,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Onboarding progress retrieved successfully',
      data: {
        currentStep: progress?.currentStep ?? MemberOnboardingStep.REQUIREMENTS,
        preOrientationCompletedLessonIds: progress?.preOrientationCompletedLessonIds ?? [],
        preOrientationCompletedAt: progress?.preOrientationCompletedAt ?? null,
      },
    });
  } catch (err) {
    logger.error('Error while getting onboarding progress', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
