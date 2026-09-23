import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus, MemberType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

const getEligibleMember = (userId?: string) => {
  if (!userId) return null;

  return prisma.member.findFirst({
    where: {
      userId,
      isActive: true,
      status: MemberStatus.APPROVED,
      memberType: MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR,
    },
    select: { id: true },
  });
};

const licenseSelect = {
  id: true,
  uniqueId: true,
  serviceLicenseUrl: true,
  serviceLicenseFileName: true,
  serviceLicenseMimeType: true,
} as const;

export const updateCurrentServiceLicense = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const member = await getEligibleMember(req.userId);
    if (!member) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message:
          'Only approved active Certified Specialist Training Officer Instructors can manage a service license',
      });
      return;
    }

    const license = await prisma.member.update({
      where: { id: member.id },
      data: {
        serviceLicenseUrl: req.body.fileUrl,
        serviceLicenseFileName: req.body.fileName,
        serviceLicenseMimeType: req.body.mimeType,
      },
      select: licenseSelect,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Service license updated successfully',
      data: license,
    });
  } catch (err) {
    logger.error('Error while updating current service license', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const deleteCurrentServiceLicense = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const member = await getEligibleMember(req.userId);
    if (!member) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message:
          'Only approved active Certified Specialist Training Officer Instructors can manage a service license',
      });
      return;
    }

    const license = await prisma.member.update({
      where: { id: member.id },
      data: {
        serviceLicenseUrl: null,
        serviceLicenseFileName: null,
        serviceLicenseMimeType: null,
      },
      select: licenseSelect,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Service license removed successfully',
      data: license,
    });
  } catch (err) {
    logger.error('Error while removing current service license', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
