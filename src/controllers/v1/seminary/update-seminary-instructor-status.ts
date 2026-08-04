import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';
import type { UpdateSeminaryInstructorStatusBody } from './types';
import {
  normalizeInstructorStatus,
  toInstructorResponse,
} from './instructor-shared';

export const updateSeminaryInstructorStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryInstructorStatusBody;

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
      data: { status: normalizeInstructorStatus(body.status) },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary instructor status updated successfully',
      data: toInstructorResponse(instructor),
    });
  } catch (err) {
    logger.error('Error while updating seminary instructor status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
