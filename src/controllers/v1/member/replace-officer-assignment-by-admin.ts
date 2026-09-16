import { HTTPSTATUS } from '@/common/http-codes';
import { UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { ReplaceOfficerAssignmentByAdminSchema } from '@/validators/member';

import type { Request, Response } from 'express';

export const replaceOfficerAssignmentByAdmin = async (
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

    const body = req.body as ReplaceOfficerAssignmentByAdminSchema;

    if (body.replacementMemberId === memberId) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Replacement member must be different from the current holder',
      });
      return;
    }

    const currentAssignment = await prisma.officerAssignment.findFirst({
      where: {
        id: assignmentId,
        memberId,
      },
      select: {
        id: true,
        officeTitleId: true,
        department: true,
        region: true,
        province: true,
        cityMunicipality: true,
        barangay: true,
        isActive: true,
        isPublic: true,
        member: {
          select: {
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

    if (!currentAssignment) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Officer assignment not found',
      });
      return;
    }

    if (!currentAssignment.isActive) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Only active officer assignments can be replaced',
      });
      return;
    }

    const replacementMember = await prisma.member.findUnique({
      where: { id: body.replacementMemberId },
      select: {
        id: true,
        isActive: true,
        userId: true,
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!replacementMember) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Replacement member not found',
      });
      return;
    }

    if (!replacementMember.isActive) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Archived members cannot receive office assignments',
      });
      return;
    }

    const duplicateAssignment = await prisma.officerAssignment.findFirst({
      where: {
        memberId: replacementMember.id,
        officeTitleId: currentAssignment.officeTitleId,
        department: currentAssignment.department,
        region: currentAssignment.region,
        province: currentAssignment.province,
        cityMunicipality: currentAssignment.cityMunicipality,
        barangay: currentAssignment.barangay,
      },
    });

    const replacementAssignment = await prisma.$transaction(async (tx) => {
      await tx.officerAssignment.update({
        where: { id: currentAssignment.id },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      });

      const savedAssignment = duplicateAssignment
        ? await tx.officerAssignment.update({
            where: { id: duplicateAssignment.id },
            data: {
              isActive: true,
              startDate: body.startDate ? new Date(body.startDate) : new Date(),
              endDate: null,
              isPublic: currentAssignment.isPublic,
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
                },
              },
            },
          })
        : await tx.officerAssignment.create({
            data: {
              member: { connect: { id: replacementMember.id } },
              officeTitle: { connect: { id: currentAssignment.officeTitleId } },
              department: currentAssignment.department,
              region: currentAssignment.region,
              province: currentAssignment.province,
              cityMunicipality: currentAssignment.cityMunicipality,
              barangay: currentAssignment.barangay,
              isActive: true,
              isPublic: currentAssignment.isPublic,
              startDate: body.startDate ? new Date(body.startDate) : new Date(),
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
                },
              },
            },
          });

      const currentMemberRemainingAssignments = await tx.officerAssignment.count({
        where: {
          memberId,
          isActive: true,
        },
      });

      if (currentMemberRemainingAssignments === 0) {
        await tx.user.update({
          where: { id: currentAssignment.member.userId },
          data: { role: UserType.MEMBER },
        });
      }

      if (replacementMember.user.role === UserType.MEMBER) {
        await tx.user.update({
          where: { id: replacementMember.userId },
          data: { role: UserType.OFFICER },
        });
      }

      return savedAssignment;
    });

    logger.info('Officer assignment replaced by admin', {
      memberId,
      replacementMemberId: replacementMember.id,
      assignmentId,
      adminUserId: req.userId,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Officer assignment replaced successfully',
      data: replacementAssignment,
    });
  } catch (err) {
    logger.error('Error while replacing officer assignment by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
