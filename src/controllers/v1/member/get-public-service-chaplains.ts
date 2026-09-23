import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus, MemberType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getPublicServiceChaplains = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const members = await prisma.member.findMany({
      where: {
        isActive: true,
        status: MemberStatus.APPROVED,
        memberType: MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        uniqueId: true,
        badgeNumber: true,
        memberType: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        extensionName: true,
        region: true,
        province: true,
        municipalityCity: true,
        barangay: true,
        preferredBranchOther: true,
        serviceLicenseUrl: true,
        serviceLicenseFileName: true,
        serviceLicenseMimeType: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            avatar: true,
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
          where: { type: 'PHOTO_2X2' },
          take: 1,
          select: {
            fileUrl: true,
          },
        },
      },
    });

    logger.info('Public service chaplains retrieved', {
      count: members.length,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public service chaplains retrieved successfully',
      data: members,
    });
  } catch (err) {
    logger.error('Error while getting public service chaplains', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
