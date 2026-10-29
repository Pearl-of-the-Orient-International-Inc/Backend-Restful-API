import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  createAssignmentStudentNotifications,
  defaultAssignmentStatus,
  getAssignedCourseForSubject,
  toAssignmentResponse,
} from './assignment-shared';
import { SeminaryAssignmentStatus } from '@/generated/prisma/enums';

import type { Request, Response } from 'express';
import type { CreateSeminaryAssignmentBody } from './types';

export const createSeminaryAssignment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateSeminaryAssignmentBody;
    const assignmentContext = await getAssignedCourseForSubject({
      subject: body.subject,
      userId: req.userId,
      res,
    });

    if (!assignmentContext) return;

    const { course, user, instructorName } = assignmentContext;
    const allowLateSubmission = body.allowLateSubmission ?? true;
    const assignment = await prisma.seminaryAssignment.create({
      data: {
        title: body.title,
        description: body.description,
        subject: body.subject,
        courseId: course.id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        instructorUserId: user.id,
        instructorName,
        assignmentType: body.assignmentType,
        dueAt: new Date(body.dueAt),
        status: body.status ?? defaultAssignmentStatus,
        totalMarks: Number(body.totalMarks),
        additionalInstructions: body.additionalInstructions,
        allowLateSubmission,
        lateSubmissionDeadline: allowLateSubmission && body.lateSubmissionDeadline
          ? new Date(body.lateSubmissionDeadline)
          : null,
        notifyStudents: body.notifyStudents ?? true,
        attachmentLabel: body.attachmentLabel,
      },
    });

    if (
      assignment.notifyStudents &&
      assignment.status === SeminaryAssignmentStatus.PUBLISHED
    ) {
      try {
        await createAssignmentStudentNotifications({
          assignmentId: assignment.id,
          course,
          title: assignment.title,
          subject: assignment.subject,
        });
      } catch (err) {
        logger.warn('Assignment notification creation failed', {
          assignmentId: assignment.id,
          err,
        });
      }
    }

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Assignment created successfully',
      data: toAssignmentResponse(assignment),
    });
  } catch (err) {
    logger.error('Error while creating seminary assignment', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
