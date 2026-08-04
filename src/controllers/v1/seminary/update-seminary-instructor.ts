import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { SeminaryInstructorStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpdateSeminaryInstructorBody } from './types';
import {
  calculateInstructorEvaluation,
  normalizeInstructorProgram,
  normalizeInstructorRank,
  normalizeInstructorStatus,
  toInstructorResponse,
} from './instructor-shared';

export const updateSeminaryInstructor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryInstructorBody;
    const evaluation = calculateInstructorEvaluation(body.evaluation);
    const rank = normalizeInstructorRank(body.rank);
    const status = body.status
      ? normalizeInstructorStatus(body.status)
      : SeminaryInstructorStatus.ACTIVE;
    const teachingPrograms = body.teachingPrograms.map(normalizeInstructorProgram);

    const existingInstructor = await prisma.seminaryInstructor.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingInstructor) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Seminary instructor not found',
      });
      return;
    }

    const instructor = await prisma.seminaryInstructor.update({
      where: { id },
      data: {
        areasOfExpertise: body.areasOfExpertise,
        attendanceParticipation: body.evaluation.attendanceParticipation,
        award: evaluation.award,
        biography: body.biography,
        contactNumber: body.contactNumber,
        credentials: body.credentials,
        educationalBackground: body.educationalBackground,
        email: body.email,
        formalPhotoUrl: body.formalPhotoUrl,
        highSchoolGraduateOrEquivalent: body.highSchoolGraduateOrEquivalent,
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
        submissionDeadline: new Date(body.submissionDeadline ?? '2026-08-01'),
        teachingPrograms,
        totalScore: evaluation.totalScore,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary instructor updated successfully',
      data: toInstructorResponse(instructor),
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: 'Email already exists',
      });
      return;
    }

    logger.error('Error while updating seminary instructor', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
