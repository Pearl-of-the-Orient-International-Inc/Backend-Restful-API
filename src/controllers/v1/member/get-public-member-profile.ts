import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getPublicMemberProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = req.params.memberId;

    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid member ID',
      });
      return;
    }

    const member = await prisma.member.findFirst({
      where: {
        uniqueId: memberId,
      },
      select: {
        id: true,
        uniqueId: true,
        badgeNumber: true,
        status: true,
        memberType: true,
        isActive: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        extensionName: true,
        churchAffiliation: true,
        churchAddress: true,
        currentPositionRole: true,
        currentPositionRoleOther: true,
        nationality: true,
        region: true,
        province: true,
        municipalityCity: true,
        barangay: true,
        preferredBranchOther: true,
        skillsTalents: true,
        elementarySchool: true,
        secondarySchool: true,
        tertiaryCollege: true,
        postGraduateStudies: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            role: true,
            accountStatus: true,
            isEmailVerified: true,
          },
        },
        preferredBranches: {
          select: {
            id: true,
            title: true,
          },
        },
        officerAssignments: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            department: true,
            region: true,
            province: true,
            cityMunicipality: true,
            barangay: true,
            startDate: true,
            officeTitle: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        applicantRequirements: {
          where: {
            OR: [
              { reviewStatus: 'APPROVED' },
              { type: 'PHOTO_2X2' },
            ],
          },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            type: true,
            fileUrl: true,
            fileName: true,
            mimeType: true,
            updatedAt: true,
          },
        },
        onboardingProgress: {
          select: {
            currentStep: true,
            preOrientationCompletedAt: true,
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
        chaplaincyTrainingProgress: {
          select: {
            completedAt: true,
          },
        },
      },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member profile not found',
      });
      return;
    }

    logger.info('Public member profile retrieved', {
      memberId,
      uniqueId: member.uniqueId,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public member profile retrieved successfully',
      data: member,
    });
  } catch (err) {
    logger.error('Error while getting public member profile', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
