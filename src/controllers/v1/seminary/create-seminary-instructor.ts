import { randomBytes } from 'crypto';
import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import {
  SeminaryInstructorStatus,
  UserAccountStatus,
  UserType,
} from '@/generated/prisma/enums';
import { hashValue } from '@/lib/password-hash';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { sendMail } from '@/mailers';
import { seminaryInstructorAccountTemplate } from '@/mailers/templates/seminary-instructor-account';
import config from '@/config';

import type { Request, Response } from 'express';
import type { CreateSeminaryInstructorBody } from './types';
import {
  calculateInstructorEvaluation,
  getNextFacultyId,
  normalizeInstructorProgram,
  normalizeInstructorRank,
  normalizeInstructorStatus,
  toInstructorResponse,
} from './instructor-shared';

const generateTemporaryPassword = (): string =>
  `Potsci!${randomBytes(5).toString('hex').toUpperCase()}9`;

export const createSeminaryInstructor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateSeminaryInstructorBody;
    const evaluation = calculateInstructorEvaluation(body.evaluation);
    const rank = normalizeInstructorRank(body.rank);
    const status = body.status
      ? normalizeInstructorStatus(body.status)
      : SeminaryInstructorStatus.ACTIVE;
    const teachingPrograms = body.teachingPrograms.map(normalizeInstructorProgram);
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashValue(temporaryPassword);

    const instructor = await prisma.$transaction(async (tx) => {
      const instructorId = await getNextFacultyId(tx);
      const user = await tx.user.create({
        data: {
          accountStatus: UserAccountStatus.ACTIVE,
          email: instructorId,
          isEmailVerified: true,
          name: body.name,
          password: hashedPassword,
          role: UserType.INSTRUCTOR,
        },
        select: { id: true },
      });

      return tx.seminaryInstructor.create({
        data: {
          areasOfExpertise: body.areasOfExpertise,
          attendanceParticipation: body.evaluation.attendanceParticipation,
          award: evaluation.award,
          biography: body.biography,
          contactNumber: body.contactNumber,
          credentials: body.credentials,
          educationalBackground: body.educationalBackground,
          email: body.email,
          facultyId: instructorId,
          formalPhotoUrl: body.formalPhotoUrl,
          highSchoolGraduateOrEquivalent:
            body.highSchoolGraduateOrEquivalent,
          isFilipinoCitizen: body.isFilipinoCitizen,
          knowledgeSkillsAssessment: body.evaluation.knowledgeSkillsAssessment,
          leadershipCharacter: body.evaluation.leadershipCharacter,
          loadUnits: body.loadUnits,
          ministerialExperienceYears: body.ministerialExperienceYears,
          ministryCommunityEngagement:
            body.evaluation.ministryCommunityEngagement,
          name: body.name,
          professionalConductEthics: body.evaluation.professionalConductEthics,
          professionalTitle: body.professionalTitle,
          rank,
          rankingClassification: evaluation.rankingClassification,
          rating: evaluation.rating,
          status,
          submissionDeadline: new Date(
            body.submissionDeadline ?? '2026-08-01',
          ),
          teachingPrograms,
          totalScore: evaluation.totalScore,
          userId: user.id,
        },
      });
    });

    const emailResult = await sendMail({
      sendTo: body.email,
      ...seminaryInstructorAccountTemplate({
        instructorId: instructor.facultyId,
        name: instructor.name,
        temporaryPassword,
      }),
    });

    if (!emailResult.success) {
      logger.warn('Instructor account created but credentials email failed', {
        email: body.email,
        instructorId: instructor.facultyId,
      });
    }

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: emailResult.success
        ? 'Seminary instructor created successfully'
        : 'Seminary instructor created successfully, but credentials email failed to send',
      data: toInstructorResponse(instructor),
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Instructor ID or email already exists',
      });
      return;
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    logger.error('Error while creating seminary instructor', {
      err,
      message,
    });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message:
        config.NODE_ENV === 'production'
          ? 'Internal server error'
          : message,
    });
  }
};
