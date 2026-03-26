import { randomBytes } from 'crypto';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { hashValue } from '@/lib/password-hash';
import { generateNextMemberUniqueId } from '@/lib/member-unique-id';
import { sendMail } from '@/mailers';
import { welcomeMemberTemplate } from '@/mailers/templates/welcome-member';
import {
  MemberStatus,
  MemberType,
  UserAccountStatus,
  UserType,
} from '@/generated/prisma/enums';

import type { Request, Response } from 'express';
import type { Prisma } from '@/generated/prisma/client';
import type { CreateMemberByAdminSchema } from '@/validators/member';

const getOptional = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const buildFullName = (firstName: string, lastName: string): string =>
  [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

const generateTemporaryPassword = (): string =>
  `Pearl!${randomBytes(5).toString('hex').toUpperCase()}9`;

const isUniqueIdConflict = (error: unknown): boolean => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  const code = (error as { code?: string }).code;
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  const normalizedTarget = Array.isArray(target)
    ? target.join(',').toLowerCase()
    : String(target ?? '').toLowerCase();

  return code === 'P2002' && normalizedTarget.includes('uniqueid');
};

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

const MAX_MEMBER_CREATE_ATTEMPTS = 5;

export const createMemberByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
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

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        memberProfile: { select: { id: true } },
      },
    });

    if (existingUser?.memberProfile) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'A member profile already exists for this email address',
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

    const temporaryPassword = existingUser ? null : generateTemporaryPassword();
    const hashedPassword = temporaryPassword ? await hashValue(temporaryPassword) : null;
    const displayName = buildFullName(body.firstName, body.lastName);

    let result:
      | {
          user: Prisma.UserGetPayload<{ select: typeof userSelect }>;
          member: Prisma.MemberGetPayload<{
            include: {
              signature: true;
              ministerialExperiences: true;
              characterReferences: true;
              preferredBranches: {
                select: { id: true; title: true };
              };
              user: { select: typeof userSelect };
            };
          }>;
          createdUser: boolean;
        }
      | null = null;

    for (let attempt = 1; attempt <= MAX_MEMBER_CREATE_ATTEMPTS; attempt += 1) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const user = existingUser
            ? await tx.user.findUniqueOrThrow({
                where: { id: existingUser.id },
                select: userSelect,
              })
            : await tx.user.create({
                data: {
                  name: displayName,
                  email: normalizedEmail,
                  password: hashedPassword!,
                  role: UserType.MEMBER,
                  accountStatus: UserAccountStatus.ACTIVE,
                  isEmailVerified: true,
                },
                select: userSelect,
              });

          const uniqueId = await generateNextMemberUniqueId(user.role);

          const createData: Prisma.MemberCreateInput = {
            user: { connect: { id: user.id } },
            status: MemberStatus.APPROVED,
            memberType: body.memberType ?? MemberType.ASSOCIATE_CHAPLAIN,
            uniqueId,
            badgeNumber: getOptional(body.badgeNumber),
            firstName: body.firstName.trim(),
            middleInitial: getOptional(body.middleInitial),
            lastName: body.lastName.trim(),
            extensionName: getOptional(body.extensionName),
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

          if (body.createdAt) {
            createData.createdAt = new Date(body.createdAt);
          }

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

          const member = await tx.member.create({
            data: createData,
            include: {
              signature: true,
              ministerialExperiences: true,
              characterReferences: true,
              preferredBranches: {
                select: { id: true, title: true },
              },
              user: {
                select: userSelect,
              },
            },
          });

          return {
            user,
            member,
            createdUser: !existingUser,
          };
        });

        break;
      } catch (error) {
        if (attempt < MAX_MEMBER_CREATE_ATTEMPTS && isUniqueIdConflict(error)) {
          logger.warn('Unique member ID conflict while creating member by admin, retrying', {
            email: normalizedEmail,
            attempt,
          });
          continue;
        }

        throw error;
      }
    }

    if (!result) {
      throw new Error('Unable to create member after retrying unique ID generation');
    }

    let emailSent = false;

    if (temporaryPassword) {
      const emailResult = await sendMail({
        sendTo: normalizedEmail,
        ...welcomeMemberTemplate(displayName, normalizedEmail, temporaryPassword),
      });

      emailSent = emailResult.success;

      if (!emailResult.success) {
        logger.warn('Member account created but welcome email failed to send', {
          email: normalizedEmail,
          memberId: result.member.id,
        });
      }
    }

    logger.info('Member profile created by admin', {
      memberId: result.member.id,
      userId: result.user.id,
      createdUser: result.createdUser,
      adminUserId: req.userId,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Member profile created successfully',
      data: {
        ...result,
        emailSent,
      },
    });
  } catch (err) {
    logger.error('Error while creating member by admin', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
