import { randomBytes } from 'crypto';
import { HTTPSTATUS } from '@/common/http-codes';
import { VerificationType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { hashValue } from '@/lib/password-hash';
import { generateNextMemberUniqueId } from '@/lib/member-unique-id';
import { calculateExpirationDate } from '@/lib/helpers';
import { buildVerificationUrl } from '@/lib/verification-redirect';
import { sendMail } from '@/mailers';
import { verifyEmailTemplate } from '@/mailers/templates/verify-email';
import { welcomeMemberTemplate } from '@/mailers/templates/welcome-member';

import type { Request, Response } from 'express';
import { Prisma } from '@/generated/prisma/client';
import type { ApplyMemberBody } from './types';

const MAX_MEMBER_CREATE_ATTEMPTS = 5;

const getOptional = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const buildFullName = (
  firstName: string,
  middleName?: string | null,
  lastName?: string | null,
  extensionName?: string | null,
): string =>
  [firstName.trim(), middleName?.trim(), lastName?.trim(), extensionName?.trim()]
    .filter(Boolean)
    .join(' ');

const generateTemporaryPassword = (): string =>
  `Pearl!${randomBytes(5).toString('hex').toUpperCase()}9`;

const isRetryableCreateConflict = (error: unknown): boolean => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  const code = (error as { code?: string }).code;
  return code === 'P2002' || code === 'P2034';
};

export const applyMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as ApplyMemberBody;
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

    if (existingUser) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'An account with this email already exists',
      });
      return;
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashValue(temporaryPassword);
    const displayName = buildFullName(
      body.firstName,
      body.middleInitial,
      body.lastName,
      body.extensionName,
    );

    let result:
      | {
          member: Prisma.MemberGetPayload<{
            include: {
              ministerialExperiences: true;
              characterReferences: true;
              signature: true;
              preferredBranches: {
                select: { id: true; title: true };
              };
              user: {
                select: {
                  id: true;
                  name: true;
                  email: true;
                  accountStatus: true;
                  isEmailVerified: true;
                };
              };
            };
          }>;
          verificationUrl: string;
        }
      | null = null;

    for (let attempt = 1; attempt <= MAX_MEMBER_CREATE_ATTEMPTS; attempt += 1) {
      try {
        result = await prisma.$transaction(
          async (tx) => {
            const user = await tx.user.create({
              data: {
                name: displayName,
                email: normalizedEmail,
                password: hashedPassword,
                role: 'MEMBER',
                accountStatus: 'PENDING',
                isEmailVerified: false,
              },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                accountStatus: true,
                isEmailVerified: true,
              },
            });

            const uniqueId = await generateNextMemberUniqueId(user.role, tx);

            const verificationCode = await tx.verificationCode.create({
              data: {
                userId: user.id,
                type: VerificationType.EMAIL_VERIFICATION,
                expiresAt: calculateExpirationDate('1h'),
                code: randomBytes(16).toString('hex'),
              },
            });

            const createData: Prisma.MemberCreateInput = {
              user: { connect: { id: user.id } },
              uniqueId,
              firstName: body.firstName.trim(),
              extensionName: getOptional(body.extensionName),
              middleInitial: getOptional(body.middleInitial),
              lastName: body.lastName.trim(),
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
                ministerialExperiences: true,
                characterReferences: true,
                signature: true,
                preferredBranches: {
                  select: { id: true, title: true },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    accountStatus: true,
                    isEmailVerified: true,
                  },
                },
              },
            });

            return {
              member,
              verificationUrl: buildVerificationUrl(user.role, verificationCode.code),
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        break;
      } catch (error) {
        if (attempt < MAX_MEMBER_CREATE_ATTEMPTS && isRetryableCreateConflict(error)) {
          logger.warn('Retrying member application creation after transaction conflict', {
            email: normalizedEmail,
            attempt,
          });
          continue;
        }

        throw error;
      }
    }

    if (!result) {
      throw new Error('Unable to create member application after retrying');
    }

    const emailResult = await sendMail({
      sendTo: normalizedEmail,
      ...welcomeMemberTemplate(
        displayName,
        normalizedEmail,
        temporaryPassword,
        result.verificationUrl,
      ),
    });

    if (!emailResult.success) {
      await sendMail({
        sendTo: normalizedEmail,
        ...verifyEmailTemplate(result.verificationUrl, displayName),
      });
    }

    logger.info('Member application submitted with pending user account', {
      memberId: result.member.id,
      userId: result.member.user.id,
      email: normalizedEmail,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message:
        'Member application submitted successfully. Please check your email to verify your account credentials.',
      data: result.member,
    });
  } catch (err) {
    logger.error('Error while applying as member', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
