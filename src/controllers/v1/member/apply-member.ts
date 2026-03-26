import { randomBytes } from 'crypto';
/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { hashValue } from '@/lib/password-hash';
import { logger } from '@/lib/winston';
import { UserAccountStatus, UserType } from '@/generated/prisma/enums';

/**
 * Types
 */
import type { Request, Response } from 'express';
import type { Prisma } from '@/generated/prisma/client';
import type { ApplyMemberBody } from './types';

const getOptional = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const buildFullName = (firstName: string, lastName: string): string =>
  [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

const generateTemporaryPassword = (): string =>
  `Pearl!${randomBytes(5).toString('hex').toUpperCase()}9`;

export const applyMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as ApplyMemberBody;
    const normalizedEmail = body.email?.trim().toLowerCase();

    if (!normalizedEmail) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Email is required',
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        role: true,
        memberProfile: { select: { id: true } },
      },
    });

    if (existingUser?.memberProfile) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'A member application already exists for this email address',
      });
      return;
    }

    if (existingUser && existingUser.role !== UserType.MEMBER) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'This email is already assigned to a non-member account',
      });
      return;
    }

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

    const userId = existingUser
      ? existingUser.id
      : (
          await prisma.user.create({
            data: {
              name: buildFullName(body.firstName, body.lastName),
              email: normalizedEmail,
              password: await hashValue(generateTemporaryPassword()),
              role: UserType.MEMBER,
              accountStatus: UserAccountStatus.PENDING,
              isEmailVerified: false,
            },
            select: { id: true },
          })
        ).id;

    const createData: Prisma.MemberCreateInput = {
      user: { connect: { id: userId } },
      firstName: body.firstName,
      extensionName: getOptional(body.extensionName),
      middleInitial: body.middleInitial ?? null,
      lastName: body.lastName,
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
      email: normalizedEmail,
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
