import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { toAssignmentResponse } from './assignment-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryAssignmentStatusBody } from './types';

export const updateSeminaryAssignmentStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryAssignmentStatusBody;
    const assignment = await prisma.seminaryAssignment.update({
      where: { id },
      data: { status: body.status },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Assignment status updated successfully',
      data: toAssignmentResponse(assignment),
    });
  } catch (err) {
    logger.error('Error while updating seminary assignment status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
