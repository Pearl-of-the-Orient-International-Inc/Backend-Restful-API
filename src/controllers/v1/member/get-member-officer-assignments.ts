import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getMemberOfficerAssignments = async (
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

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!member) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    const assignments = await prisma.officerAssignment.findMany({
      where: { memberId },
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
      select: {
        id: true,
        memberId: true,
        officeTitleId: true,
        department: true,
        region: true,
        province: true,
        cityMunicipality: true,
        barangay: true,
        isActive: true,
        isPublic: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        officeTitle: {
          select: {
            id: true,
            name: true,
            level: true,
            maxSlots: true,
            isActive: true,
            isPublic: true,
          },
        },
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member officer assignments retrieved successfully',
      data: assignments,
    });
  } catch (err) {
    logger.error('Error while fetching member officer assignments', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
