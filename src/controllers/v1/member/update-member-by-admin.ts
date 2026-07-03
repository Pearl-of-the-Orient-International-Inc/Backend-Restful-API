import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { MemberType, UserType } from '@/generated/prisma/enums';

import type { Request, Response } from 'express';
import type { Prisma } from '@/generated/prisma/client';
import type { CreateMemberByAdminSchema } from '@/validators/member';

const getOptional = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const buildFullName = (firstName: string, lastName: string): string =>
  [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  position: true,
  accountStatus: true,
  isEmailVerified: true,
  isTwoFactorEnabled: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const updateMemberByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const memberId = req.params.id;

    if (!memberId || Array.isArray(memberId)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Invalid member ID',
      });
      return;
    }

    const body = req.body as CreateMemberByAdminSchema;
    const normalizedEmail = body.email.trim().toLowerCase();
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

    const existingMember = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        userId: true,
        signature: { select: { id: true } },
      },
    });

    if (!existingMember) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
      return;
    }

    const conflictingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        role: true,
      },
    });

    if (conflictingUser && conflictingUser.id !== existingMember.userId) {
      if (conflictingUser.role !== UserType.MEMBER) {
        res.status(HTTPSTATUS.CONFLICT).json({
          code: 'CONFLICT',
          message: 'This email is already assigned to a non-member account',
        });
        return;
      }

      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'This email is already assigned to another member account',
      });
      return;
    }

    const displayName = buildFullName(body.firstName, body.lastName);

    const updatedMember = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingMember.userId },
        data: {
          name: displayName,
          email: normalizedEmail,
        },
      });

      const updateData: Prisma.MemberUpdateInput = {
        badgeNumber: getOptional(body.badgeNumber),
        firstName: body.firstName.trim(),
        middleInitial: getOptional(body.middleInitial),
        lastName: body.lastName.trim(),
        extensionName: getOptional(body.extensionName),
        memberType: body.memberType ?? MemberType.ASSOCIATE_CHAPLAIN,
        mobilePhoneNumber: getOptional(body.mobilePhoneNumber),
        homeAddress: getOptional(body.homeAddress),
        civilStatus: body.civilStatus ?? null,
        gender: body.gender,
        nationality: getOptional(body.nationality),
        dateOfBirth: new Date(body.dateOfBirth),
        region: getOptional(body.region),
        province: getOptional(body.province),
        municipalityCity: getOptional(body.municipalityCity),
        barangay: getOptional(body.barangay),
        emergencyContactName: getOptional(body.emergencyContactName),
        emergencyContactMobile: getOptional(body.emergencyContactMobile),
        churchAffiliation: getOptional(body.churchAffiliation),
        churchAddress: getOptional(body.churchAddress),
        currentPositionRole: getOptional(body.currentPositionRole),
        currentPositionRoleOther: getOptional(body.currentPositionRoleOther),
        height: getOptional(body.height),
        weight: getOptional(body.weight),
        bloodType: getOptional(body.bloodType),
        colorOfEyes: getOptional(body.colorOfEyes),
        colorOfSkin: getOptional(body.colorOfSkin),
        sssNumber: getOptional(body.sssNumber),
        tinNumber: getOptional(body.tinNumber),
        skillsTalents: getOptional(body.skillsTalents),
        preferredBranchOther: getOptional(body.preferredBranchOther),
        elementarySchool: getOptional(body.elementarySchool),
        secondarySchool: getOptional(body.secondarySchool),
        tertiaryCollege: getOptional(body.tertiaryCollege),
        postGraduateStudies: getOptional(body.postGraduateStudies),
        ministerialExperiences: {
          deleteMany: {},
          create:
            body.ministerialExperiences?.map((item, index) => ({
              roleDescription: item.roleDescription,
              yearsApprox: item.yearsApprox,
              order: index + 1,
            })) ?? [],
        },
        characterReferences: {
          deleteMany: {},
          create:
            body.characterReferences?.map((item, index) => ({
              name: item.name,
              positionRelationship: item.positionRelationship,
              contactNumber: item.contactNumber,
              order: index + 1,
            })) ?? [],
        },
        preferredBranches: {
          set: preferredBranchIds.map((id) => ({ id })),
        },
      };

      if ('profileBannerUrl' in body) {
        updateData.profileBannerUrl = getOptional(body.profileBannerUrl);
      }

      if (typeof body.profileBannerPositionY === 'number') {
        updateData.profileBannerPositionY = body.profileBannerPositionY;
      }

      if (body.createdAt) {
        updateData.createdAt = new Date(body.createdAt);
      }

      if (body.signature) {
        updateData.signature = {
          upsert: {
            create: {
              type: body.signature.type,
              signatureData: body.signature.signatureData,
            },
            update: {
              type: body.signature.type,
              signatureData: body.signature.signatureData,
            },
          },
        };
      } else if (existingMember.signature) {
        updateData.signature = {
          delete: true,
        };
      }

      return tx.member.update({
        where: { id: memberId },
        data: updateData,
        include: {
          ministerialExperiences: {
            orderBy: { order: 'asc' },
          },
          characterReferences: {
            orderBy: { order: 'asc' },
          },
          preferredBranches: {
            select: { id: true, title: true },
          },
          signature: true,
          user: {
            select: userSelect,
          },
        },
      });
    });

    logger.info('Member updated by admin', {
      memberId,
      adminUserId: req.userId,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Member updated successfully',
      data: updatedMember,
    });
  } catch (err) {
    logger.error('Error while updating member by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
