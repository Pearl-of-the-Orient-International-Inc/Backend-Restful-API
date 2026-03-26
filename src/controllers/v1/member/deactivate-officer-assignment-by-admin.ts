import { HTTPSTATUS } from '@/common/http-codes';
import { UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const deactivateOfficerAssignmentByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const assignmentId = Array.isArray(req.params.assignmentId)
      ? req.params.assignmentId[0]
      : req.params.assignmentId;

    if (
      !memberId ||
      typeof memberId !== 'string' ||
      !assignmentId ||
      typeof assignmentId !== 'string'
    ) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid member and assignment IDs are required',
      });
      return;
    }

    const assignment = await prisma.officerAssignment.findFirst({
      where: {
        id: assignmentId,
        memberId,
      },
      select: {
        id: true,
        isActive: true,
        member: {
          select: {
            id: true,
            userId: true,
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

    if (!assignment) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Officer assignment not found',
      });
      return;
    }

    if (!assignment.isActive) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'This officer assignment is already inactive',
      });
      return;
    }

    const updatedAssignment = await prisma.$transaction(async (tx) => {
      const savedAssignment = await tx.officerAssignment.update({
        where: { id: assignmentId },
        data: {
          isActive: false,
          endDate: new Date(),
        },
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

      const remainingActiveAssignments = await tx.officerAssignment.count({
        where: {
          memberId,
          isActive: true,
        },
      });

      if (remainingActiveAssignments === 0) {
        await tx.user.update({
          where: { id: assignment.member.userId },
          data: { role: UserType.MEMBER },
        });
      }

      return savedAssignment;
    });

    logger.info('Officer assignment deactivated by admin', {
      memberId,
      assignmentId,
      adminUserId: req.userId,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Officer assignment deactivated successfully',
      data: updatedAssignment,
    });
  } catch (err) {
    logger.error('Error while deactivating officer assignment by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
