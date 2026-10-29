import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { SeminaryAssignmentStatus } from '@/generated/prisma/enums';
import {
  canManageAssignment,
  createAssignmentStudentNotifications,
  removeAssignmentStudentNotifications,
  toAssignmentResponse,
} from './assignment-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryAssignmentStatusBody } from './types';

export const updateSeminaryAssignmentStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryAssignmentStatusBody;
    if (!(await canManageAssignment({ assignmentId: id, userId: req.userId, res }))) return;
    const assignment = await prisma.seminaryAssignment.update({
      where: { id },
      data: { status: body.status },
    });

    if (
      assignment.status === SeminaryAssignmentStatus.PUBLISHED &&
      assignment.notifyStudents &&
      assignment.courseId
    ) {
      const course = await prisma.seminaryCourse.findUnique({
        where: { id: assignment.courseId },
        select: { courseName: true, courseCode: true, program: true },
      });
      if (course) {
        await createAssignmentStudentNotifications({
          assignmentId: assignment.id,
          course,
          title: assignment.title,
          subject: assignment.subject,
        });
      }
    } else {
      await removeAssignmentStudentNotifications(assignment.id);
    }

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
