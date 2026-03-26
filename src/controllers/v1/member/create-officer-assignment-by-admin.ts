import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { OfficeTitleLevel, UserType } from '@/generated/prisma/enums';

import type { Request, Response } from 'express';
import type { CreateOfficerAssignmentByAdminSchema } from '@/validators/member';

const getOptional = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const getRequiredJurisdictionField = (
  level: OfficeTitleLevel,
): keyof Pick<
  CreateOfficerAssignmentByAdminSchema,
  'department' | 'region' | 'province' | 'cityMunicipality' | 'barangay'
> | null => {
  switch (level) {
    case OfficeTitleLevel.NATIONAL_CHAPLAIN_DIRECTOR:
      return 'department';
    case OfficeTitleLevel.REGIONAL_CHAPLAIN_DIRECTOR:
    case OfficeTitleLevel.REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR:
      return 'region';
    case OfficeTitleLevel.PROVINCIAL_CHAPLAIN_DIRECTOR:
    case OfficeTitleLevel.PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR:
      return 'province';
    case OfficeTitleLevel.CITY_CHAPLAIN:
    case OfficeTitleLevel.MUNICIPAL_CHAPLAIN:
    case OfficeTitleLevel.CITY_MUNICIPAL_DEPUTY_CHAPLAIN:
      return 'cityMunicipality';
    case OfficeTitleLevel.BARANGAY_CHAPLAIN:
    case OfficeTitleLevel.BARANGAY_DEPUTY_CHAPLAIN:
      return 'barangay';
    case OfficeTitleLevel.CHIEF_CHAPLAIN:
    default:
      return null;
  }
};

const getJurisdictionLabel = (field: string) => {
  switch (field) {
    case 'department':
      return 'department';
    case 'region':
      return 'region';
    case 'province':
      return 'province';
    case 'cityMunicipality':
      return 'city / municipality';
    case 'barangay':
      return 'barangay';
    default:
      return field;
  }
};

export const createOfficerAssignmentByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!memberId || typeof memberId !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid member ID is required',
      });
      return;
    }

    const body = req.body as CreateOfficerAssignmentByAdminSchema;

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
        userId: true,
        user: {
          select: {
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

    if (!member.isActive) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Archived members cannot receive office assignments',
      });
      return;
    }

    const officeTitle = await prisma.officeTitle.findUnique({
      where: { id: body.officeTitleId },
      select: {
        id: true,
        name: true,
        level: true,
        maxSlots: true,
        isActive: true,
      },
    });

    if (!officeTitle) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Office title not found',
      });
      return;
    }

    if (!officeTitle.isActive) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Inactive office titles cannot be assigned',
      });
      return;
    }

    const assignmentData = {
      department: getOptional(body.department),
      region: getOptional(body.region),
      province: getOptional(body.province),
      cityMunicipality: getOptional(body.cityMunicipality),
      barangay: getOptional(body.barangay),
    };

    const requiredField = getRequiredJurisdictionField(officeTitle.level);
    if (requiredField && !assignmentData[requiredField]) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: `${getJurisdictionLabel(requiredField)} is required for ${officeTitle.name}`,
      });
      return;
    }

    const duplicateAssignment = await prisma.officerAssignment.findFirst({
      where: {
        memberId,
        officeTitleId: officeTitle.id,
        department: assignmentData.department,
        region: assignmentData.region,
        province: assignmentData.province,
        cityMunicipality: assignmentData.cityMunicipality,
        barangay: assignmentData.barangay,
      },
    });

    if (officeTitle.maxSlots !== null) {
      const activeOccupancy = await prisma.officerAssignment.count({
        where: {
          officeTitleId: officeTitle.id,
          isActive: true,
          department: assignmentData.department,
          region: assignmentData.region,
          province: assignmentData.province,
          cityMunicipality: assignmentData.cityMunicipality,
          barangay: assignmentData.barangay,
          ...(duplicateAssignment
            ? { id: { not: duplicateAssignment.id } }
            : {}),
        },
      });

      if (activeOccupancy >= officeTitle.maxSlots) {
        res.status(HTTPSTATUS.CONFLICT).json({
          code: 'CONFLICT',
          message: `${officeTitle.name} has already reached its assignment limit for this jurisdiction`,
        });
        return;
      }
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const savedAssignment = duplicateAssignment
        ? await tx.officerAssignment.update({
            where: { id: duplicateAssignment.id },
            data: {
              isActive: true,
              startDate: body.startDate ? new Date(body.startDate) : new Date(),
              endDate: null,
            },
            include: {
              officeTitle: true,
            },
          })
        : await tx.officerAssignment.create({
            data: {
              member: { connect: { id: memberId } },
              officeTitle: { connect: { id: officeTitle.id } },
              ...assignmentData,
              isActive: true,
              startDate: body.startDate ? new Date(body.startDate) : new Date(),
            },
            include: {
              officeTitle: true,
            },
          });

      if (member.user.role === UserType.MEMBER) {
        await tx.user.update({
          where: { id: member.userId },
          data: { role: UserType.OFFICER },
        });
      }

      return savedAssignment;
    });

    logger.info('Officer assignment created by admin', {
      memberId,
      officeTitleId: officeTitle.id,
      assignmentId: assignment.id,
      adminUserId: req.userId,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Officer assignment created successfully',
      data: assignment,
    });
  } catch (err) {
    logger.error('Error while creating officer assignment by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
