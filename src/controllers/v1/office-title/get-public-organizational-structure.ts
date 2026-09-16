import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { Request, Response } from 'express';

export const getPublicOrganizationalStructure = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const offices = await prisma.officeTitle.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        level: true,
        description: true,
        sections: true,
        sortOrder: true,
        reportsToId: true,
        assignments: {
          where: {
            isActive: true,
            isPublic: true,
            member: { isActive: true, status: MemberStatus.APPROVED },
          },
          orderBy: [{ startDate: 'asc' }],
          select: {
            id: true,
            memberId: true,
            department: true,
            region: true,
            province: true,
            cityMunicipality: true,
            barangay: true,
            startDate: true,
            member: {
              select: {
                firstName: true,
                middleInitial: true,
                lastName: true,
                extensionName: true,
                user: { select: { avatar: true } },
              },
            },
          },
        },
      },
    });

    const data = offices.map((office) => ({
      id: office.id,
      name: office.name,
      level: office.level,
      description: office.description,
      sections: office.sections,
      sortOrder: office.sortOrder,
      reportsToId: office.reportsToId,
      officers: office.assignments.map((assignment) => ({
        id: assignment.id,
        memberId: assignment.memberId,
        name: [
          assignment.member.firstName,
          assignment.member.middleInitial,
          assignment.member.lastName,
          assignment.member.extensionName,
        ].filter(Boolean).join(' '),
        avatar: assignment.member.user.avatar,
        jurisdiction: [
          assignment.department,
          assignment.region,
          assignment.province,
          assignment.cityMunicipality,
          assignment.barangay,
        ].filter(Boolean).join(' · ') || null,
        startDate: assignment.startDate,
      })),
    }));

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public organizational structure retrieved successfully',
      data,
    });
  } catch (err) {
    logger.error('Error while fetching public organizational structure', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
