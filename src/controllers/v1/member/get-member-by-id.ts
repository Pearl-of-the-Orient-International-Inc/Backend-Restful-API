import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getMemberById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = req.params.id;

    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid member ID',
      });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        ministerialExperiences: {
          orderBy: { order: 'asc' },
        },
        characterReferences: {
          orderBy: { order: 'asc' },
        },
        applicantRequirements: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            type: true,
            reviewStatus: true,
            fileUrl: true,
            fileName: true,
            mimeType: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        onboardingProgress: {
          select: {
            currentStep: true,
            preOrientationCompletedLessonIds: true,
            preOrientationCompletedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        paymentCheckout: {
          select: {
            id: true,
            paymentMethod: true,
            proofOfPaymentUrl: true,
            isPromissoryNote: true,
            promissoryNoteUrl: true,
            submittedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        onlineInterviewAppointment: {
          select: {
            id: true,
            interviewerId: true,
            interviewerName: true,
            day: true,
            timeSlot: true,
            zoomLink: true,
            meetingId: true,
            passcode: true,
            confirmedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        idGenerationAsset: {
          select: {
            id: true,
            profileUrl: true,
            qrCodeUrl: true,
            certificateUrl: true,
            generatedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        chaplaincyTrainingProgress: {
          select: {
            id: true,
            completedLessonIds: true,
            essayAnswers: true,
            completedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        preferredBranches: {
          select: { id: true, title: true },
        },
        taggedEvents: {
          orderBy: { taggedAt: 'desc' },
          select: {
            id: true,
            taggedAt: true,
            event: {
              select: {
                id: true,
                name: true,
                category: true,
                type: true,
                location: true,
                onlineLink: true,
                startsAt: true,
                endsAt: true,
                visibility: true,
                organizer: true,
                thumbnailUrl: true,
              },
            },
          },
        },
        signature: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    logger.info('Member retrieved by admin', { memberId });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member retrieved successfully',
      data: member,
    });
  } catch (err) {
    logger.error('Error while getting member by id', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
