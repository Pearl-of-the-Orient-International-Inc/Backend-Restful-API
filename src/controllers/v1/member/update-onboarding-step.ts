import { HTTPSTATUS } from '@/common/http-codes';
import { MemberOnboardingStep, MemberPaymentMethod } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpdateOnboardingStepBody } from './types';

export const updateOnboardingStep = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const PRE_ORIENTATION_REQUIRED_LESSON_COUNT = 5;
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
    const existingProgress = await prisma.memberOnboardingProgress.findUnique({
      where: { memberId: member.id },
      select: {
        preOrientationCompletedLessonIds: true,
        preOrientationCompletedAt: true,
      },
    });

    const stepsRequiringPreOrientationCompletion = new Set<MemberOnboardingStep>([
      MemberOnboardingStep.PAYMENT_CHECKOUT,
      MemberOnboardingStep.ONLINE_INTERVIEW,
      MemberOnboardingStep.ID_GENERATION,
      MemberOnboardingStep.CHAPLAINCY_101,
      MemberOnboardingStep.OATH_TAKING,
    ]);

    const requiresPreOrientationCompletion =
      stepsRequiringPreOrientationCompletion.has(body.currentStep);

    if (requiresPreOrientationCompletion) {
      const completedCount =
        existingProgress?.preOrientationCompletedLessonIds.length ?? 0;
      const hasCompletedAt = Boolean(existingProgress?.preOrientationCompletedAt);

      if (
        completedCount < PRE_ORIENTATION_REQUIRED_LESSON_COUNT ||
        !hasCompletedAt
      ) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message:
            'Pre-orientation is not completed. Please finish all lessons first.',
        });
        return;
      }
    }

    const stepsRequiringPaymentCompletion = new Set<MemberOnboardingStep>([
      MemberOnboardingStep.ONLINE_INTERVIEW,
      MemberOnboardingStep.ID_GENERATION,
      MemberOnboardingStep.CHAPLAINCY_101,
      MemberOnboardingStep.OATH_TAKING,
    ]);

    const requiresPaymentCompletion =
      stepsRequiringPaymentCompletion.has(body.currentStep);

    if (requiresPaymentCompletion) {
      const paymentCheckout = await prisma.memberPaymentCheckout.findUnique({
        where: { memberId: member.id },
        select: {
          paymentMethod: true,
          proofOfPaymentUrl: true,
          isPromissoryNote: true,
          promissoryNoteUrl: true,
        },
      });

      if (!paymentCheckout) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message: 'Payment checkout is not completed yet.',
        });
        return;
      }

      const hasProof = Boolean(paymentCheckout.proofOfPaymentUrl);
      const hasPromissory = Boolean(paymentCheckout.promissoryNoteUrl);

      if (paymentCheckout.isPromissoryNote && !hasPromissory) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message: 'Signed promissory note is required.',
        });
        return;
      }

      if (
        paymentCheckout.paymentMethod !== MemberPaymentMethod.CASH &&
        !paymentCheckout.isPromissoryNote &&
        !hasProof
      ) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message: 'Proof of payment is required for non-cash payment method.',
        });
        return;
      }
    }

    const stepsRequiringOnlineInterviewCompletion = new Set<MemberOnboardingStep>([
      MemberOnboardingStep.ID_GENERATION,
      MemberOnboardingStep.CHAPLAINCY_101,
      MemberOnboardingStep.OATH_TAKING,
    ]);

    const requiresOnlineInterviewCompletion =
      stepsRequiringOnlineInterviewCompletion.has(body.currentStep);

    if (requiresOnlineInterviewCompletion) {
      const appointment = await prisma.memberOnlineInterviewAppointment.findUnique({
        where: { memberId: member.id },
        select: {
          interviewerId: true,
          day: true,
          timeSlot: true,
          zoomLink: true,
        },
      });

      if (
        !appointment ||
        !appointment.interviewerId ||
        !appointment.day ||
        !appointment.timeSlot ||
        !appointment.zoomLink
      ) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message:
            'Online interview appointment is incomplete. Please confirm interviewer, day, time slot, and Zoom link.',
        });
        return;
      }
    }

    const stepsRequiringIdGenerationCompletion = new Set<MemberOnboardingStep>([
      MemberOnboardingStep.CHAPLAINCY_101,
      MemberOnboardingStep.OATH_TAKING,
    ]);

    const requiresIdGenerationCompletion =
      stepsRequiringIdGenerationCompletion.has(body.currentStep);

    if (requiresIdGenerationCompletion) {
      const idGenerationAsset = await prisma.memberIdGenerationAsset.findUnique({
        where: { memberId: member.id },
        select: {
          qrCodeUrl: true,
          certificateUrl: true,
        },
      });

      if (!idGenerationAsset?.qrCodeUrl || !idGenerationAsset?.certificateUrl) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message:
            'Member ID generation is incomplete. Please save QR code and certificate first.',
        });
        return;
      }
    }

    const requiresChaplaincyCompletion = body.currentStep === MemberOnboardingStep.OATH_TAKING;

    if (requiresChaplaincyCompletion) {
      const LESSON_COUNT = 8;
      const ESSAY_COUNT = 10;

      const chaplaincyProgress = await prisma.memberChaplaincyTrainingProgress.findUnique({
        where: { memberId: member.id },
        select: {
          completedLessonIds: true,
          essayAnswers: true,
          completedAt: true,
        },
      });

      const completedLessonCount = chaplaincyProgress?.completedLessonIds.length ?? 0;
      const answers = (chaplaincyProgress?.essayAnswers ?? {}) as Record<string, string>;
      const answeredCount = Object.values(answers).filter((answer) => answer?.trim().length > 0).length;

      if (
        !chaplaincyProgress ||
        completedLessonCount < LESSON_COUNT ||
        answeredCount < ESSAY_COUNT ||
        !chaplaincyProgress.completedAt
      ) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message:
            'Chaplaincy 101 is incomplete. Please complete all lessons and assessment answers first.',
        });
        return;
      }
    }

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
