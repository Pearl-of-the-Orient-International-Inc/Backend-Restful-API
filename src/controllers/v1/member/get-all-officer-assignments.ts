import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getAllOfficerAssignments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const activeOnlyQuery = req.query.activeOnly;
    const activeOnly =
      activeOnlyQuery === 'false' ||
      (Array.isArray(activeOnlyQuery) && activeOnlyQuery.includes('false'))
        ? false
        : true;

    const assignments = await prisma.officerAssignment.findMany({
      where: activeOnly ? { isActive: true } : undefined,
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
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        member: {
          select: {
            id: true,
            uniqueId: true,
            firstName: true,
            middleInitial: true,
            lastName: true,
            extensionName: true,
            memberType: true,
            status: true,
            isActive: true,
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
        },
        officeTitle: {
          select: {
            id: true,
            name: true,
            level: true,
            maxSlots: true,
            isActive: true,
          },
        },
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Officer assignments retrieved successfully',
      data: assignments,
    });
  } catch (err) {
    logger.error('Error while fetching officer assignments', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
