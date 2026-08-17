import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { getAssignedCourseForSubject } from './assignment-shared';
import { toExaminationResponse } from './examination-shared';

import type { Request, Response } from 'express';
import type { CreateSeminaryExaminationBody } from './types';

export const createSeminaryExamination = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateSeminaryExaminationBody;
    const examinationContext = await getAssignedCourseForSubject({
      subject: body.subject,
      userId: req.userId,
      res,
    });

    if (!examinationContext) return;

    const { course, user, instructorName } = examinationContext;
    const examination = await prisma.seminaryExamination.create({
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

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Examination created successfully',
      data: toExaminationResponse(examination),
    });
  } catch (err) {
    logger.error('Error while creating seminary examination', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
