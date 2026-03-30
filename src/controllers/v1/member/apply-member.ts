/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { generateNextMemberUniqueId } from '@/lib/member-unique-id';

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

const MAX_MEMBER_CREATE_ATTEMPTS = 5;

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

    let createdMember:
      | Prisma.MemberGetPayload<{
          include: {
            ministerialExperiences: true;
            characterReferences: true;
            signature: true;
            preferredBranches: {
              select: { id: true; title: true };
            };
          };
        }>
      | null = null;

    for (let attempt = 1; attempt <= MAX_MEMBER_CREATE_ATTEMPTS; attempt += 1) {
      try {
        const uniqueId = await generateNextMemberUniqueId(user.role);

        const createData: Prisma.MemberCreateInput = {
          user: { connect: { id: userId } },
          uniqueId,
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

        createdMember = await prisma.member.create({
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

        break;
      } catch (error) {
        if (attempt < MAX_MEMBER_CREATE_ATTEMPTS && isUniqueIdConflict(error)) {
          logger.warn('Unique member ID conflict while applying as member, retrying', {
            userId,
            attempt,
          });
          continue;
        }

        throw error;
      }
    }

    if (!createdMember) {
      throw new Error('Unable to create member after retrying unique ID generation');
    }

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
