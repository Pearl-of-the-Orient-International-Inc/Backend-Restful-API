/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { UserType } from '@/generated/prisma/enums';

/**
 * Types
 */
import type { Request, Response } from 'express';
import type { Prisma } from '@/generated/prisma/client';
import type { ApplyMemberBody } from './types';

export const applyMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, memberProfile: { select: { id: true } } },
    });

    if (!user) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    if (user.role !== UserType.MEMBER) {
      res.status(HTTPSTATUS.FORBIDDEN).json({
        code: 'FORBIDDEN',
        message: 'Only MEMBER accounts can apply',
      });
      return;
    }

    if (user.memberProfile) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Member application already exists for this user',
      });
      return;
    }

    const body = req.body as ApplyMemberBody;
    const preferredBranchIds = body.preferredBranchIds ?? [];

    if (preferredBranchIds.length > 0) {
      const branchCount = await prisma.branchOfService.count({
        where: { id: { in: preferredBranchIds } },
      });

      if (branchCount !== preferredBranchIds.length) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message: 'One or more preferredBranchIds are invalid',
        });
        return;
      }
    }

    const createData: Prisma.MemberCreateInput = {
      user: { connect: { id: userId } },
      firstName: body.firstName,
      lastName: body.lastName,
      mobilePhoneNumber: body.mobilePhoneNumber,
      homeAddress: body.homeAddress,
      civilStatus: body.civilStatus,
      gender: body.gender,
      nationality: body.nationality,
      dateOfBirth: new Date(body.dateOfBirth),
      region: body.region,
      province: body.province,
      municipalityCity: body.municipalityCity,
      barangay: body.barangay,
      emergencyContactName: body.emergencyContactName,
      emergencyContactMobile: body.emergencyContactMobile,
      recentIdPhotoUrl: body.recentIdPhotoUrl ?? null,
      churchAffiliation: body.churchAffiliation,
      churchAddress: body.churchAddress,
      currentPositionRole: body.currentPositionRole,
      currentPositionRoleOther: body.currentPositionRoleOther ?? null,
      height: body.height ?? null,
      weight: body.weight ?? null,
      bloodType: body.bloodType ?? null,
      colorOfEyes: body.colorOfEyes ?? null,
      colorOfSkin: body.colorOfSkin ?? null,
      sssNumber: body.sssNumber ?? null,
      tinNumber: body.tinNumber ?? null,
      skillsTalents: body.skillsTalents ?? null,
      preferredBranchOther: body.preferredBranchOther ?? null,
      elementarySchool: body.elementarySchool ?? null,
      secondarySchool: body.secondarySchool ?? null,
      tertiaryCollege: body.tertiaryCollege ?? null,
      postGraduateStudies: body.postGraduateStudies ?? null,
      ministerialExperiences: {
        create:
          body.ministerialExperiences?.map((item, index) => ({
            roleDescription: item.roleDescription,
            yearsApprox: item.yearsApprox,
            order: index + 1,
          })) ?? [],
      },
      characterReferences: {
        create:
          body.characterReferences?.map((item, index) => ({
            name: item.name,
            positionRelationship: item.positionRelationship,
            contactNumber: item.contactNumber,
            order: index + 1,
          })) ?? [],
      },
    };

    if (preferredBranchIds.length > 0) {
      createData.preferredBranches = {
        connect: preferredBranchIds.map((id) => ({ id })),
      };
    }

    if (body.signature) {
      createData.signature = {
        create: {
          type: body.signature.type,
          signatureData: body.signature.signatureData,
        },
      };
    }

    const createdMember = await prisma.member.create({
      data: createData,
      include: {
        ministerialExperiences: true,
        characterReferences: true,
        signature: true,
        preferredBranches: {
          select: { id: true, title: true },
        },
      },
    });

    logger.info('Member application submitted', {
      memberId: createdMember.id,
      userId,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Member application submitted successfully',
      data: createdMember,
    });
  } catch (err) {
    logger.error('Error while applying as member', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
