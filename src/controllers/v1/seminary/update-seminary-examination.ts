import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { getAssignedCourseForSubject } from './assignment-shared';
import { canManageExamination, toExaminationResponse } from './examination-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryExaminationBody } from './types';

export const updateSeminaryExamination = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryExaminationBody;
    if (!(await canManageExamination({ examinationId: id, userId: req.userId, res }))) return;

    const examinationContext = await getAssignedCourseForSubject({
      subject: body.subject,
      userId: req.userId,
      res,
    });

    if (!examinationContext) return;

    const { course, user, instructorName } = examinationContext;
    const examination = await prisma.seminaryExamination.update({
      where: { id },
      data: {
        title: body.title,
        coverage: body.coverage,
        subject: body.subject,
        courseId: course.id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        instructorUserId: user.id,
        instructorName,
        examType: body.examType,
        scheduledAt: new Date(body.scheduledAt),
        durationMinutes: Number(body.durationMinutes),
        status: body.status ?? 'DRAFT',
        totalPoints: Number(body.totalPoints),
        passingScore: Number(body.passingScore),
        instructions: body.instructions,
        randomizeQuestions: body.randomizeQuestions ?? false,
        showResults: body.showResults ?? true,
        questions: body.questions,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Examination updated successfully',
      data: toExaminationResponse(examination),
    });
  } catch (err) {
    logger.error('Error while updating seminary examination', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
