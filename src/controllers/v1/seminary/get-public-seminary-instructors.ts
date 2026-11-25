import { HTTPSTATUS } from '@/common/http-codes';
import { SeminaryInstructorStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

/** Public landing-page directory. Deliberately excludes contact and account data. */
export const getPublicSeminaryInstructors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const instructors = await prisma.seminaryInstructor.findMany({
      where: { status: { in: [SeminaryInstructorStatus.ACTIVE, SeminaryInstructorStatus.PART_TIME] } },
      orderBy: [{ rank: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        professionalTitle: true,
        rank: true,
        teachingPrograms: true,
        areasOfExpertise: true,
        biography: true,
        formalPhotoUrl: true,
      },
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public seminary instructors retrieved successfully',
      data: instructors,
    });
  } catch (err) {
    logger.error('Error while getting public seminary instructors', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' });
  }
};
