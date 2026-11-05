import type { Request, Response } from 'express';

import { HTTPSTATUS } from '@/common/http-codes';
import { OfficeTitleLevel } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { UpdateOfficerAssignmentByAdminSchema } from '@/validators/member';

const optionalText = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized || null;
};

const requiredFieldsForLevel = (level: OfficeTitleLevel) => {
  switch (level) {
    case OfficeTitleLevel.REGIONAL_CHAPLAIN_DIRECTOR:
    case OfficeTitleLevel.REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR:
      return ['region'] as const;
    case OfficeTitleLevel.PROVINCIAL_CHAPLAIN_DIRECTOR:
    case OfficeTitleLevel.PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR:
      return ['region', 'province'] as const;
    case OfficeTitleLevel.CITY_CHAPLAIN:
    case OfficeTitleLevel.MUNICIPAL_CHAPLAIN:
    case OfficeTitleLevel.CITY_MUNICIPAL_DEPUTY_CHAPLAIN:
      return ['region', 'province', 'cityMunicipality'] as const;
    case OfficeTitleLevel.BARANGAY_CHAPLAIN:
    case OfficeTitleLevel.BARANGAY_DEPUTY_CHAPLAIN:
      return ['region', 'province', 'cityMunicipality', 'barangay'] as const;
    default:
      return [] as const;
  }
};

const fieldLabel = (field: string) =>
  field === 'cityMunicipality' ? 'city / municipality' : field;

export const updateOfficerAssignmentByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const assignmentId = Array.isArray(req.params.assignmentId)
      ? req.params.assignmentId[0]
      : req.params.assignmentId;
    if (!memberId || !assignmentId) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({ code: 'BAD_REQUEST', message: 'Valid member and assignment IDs are required' });
      return;
    }

    const assignment = await prisma.officerAssignment.findFirst({
      where: { id: assignmentId, memberId },
      include: { officeTitle: { select: { id: true, name: true, level: true } } },
    });
    if (!assignment) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Office assignment not found for this member' });
      return;
    }

    const body = req.body as UpdateOfficerAssignmentByAdminSchema;
    const values = {
      department: optionalText(body.department),
      region: optionalText(body.region),
      province: optionalText(body.province),
      cityMunicipality: optionalText(body.cityMunicipality),
      barangay: optionalText(body.barangay),
    };
    const missing = requiredFieldsForLevel(assignment.officeTitle.level).find(
      (field) => !values[field],
    );
    if (missing) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: `${fieldLabel(missing)} is required for ${assignment.officeTitle.name}`,
      });
      return;
    }

    const startDate = body.startDate ? new Date(body.startDate) : assignment.startDate;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    if (endDate && endDate < startDate) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'End date cannot be before the assignment start date',
      });
      return;
    }

    const updated = await prisma.officerAssignment.update({
      where: { id: assignment.id },
      data: { ...values, startDate, endDate },
      include: { officeTitle: true },
    });

    logger.info('Officer assignment corrected by admin', {
      memberId,
      assignmentId,
      adminUserId: req.userId,
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Office assignment updated successfully',
      data: updated,
    });
  } catch (err) {
    logger.error('Error while updating officer assignment by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to update office assignment' });
  }
};
