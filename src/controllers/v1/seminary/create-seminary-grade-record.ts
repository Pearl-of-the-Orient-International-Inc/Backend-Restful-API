import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { getAssignedCourseForSubject } from './assignment-shared';
import {
  buildGradeRemark,
  defaultGradeStatus,
  generateGradeRecordNumber,
  getProgramLabel,
  getStudentName,
  toGradeRecordResponse,
} from './grade-record-shared';

import type { Request, Response } from 'express';
import type { CreateSeminaryGradeRecordBody } from './types';

export const createSeminaryGradeRecord = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateSeminaryGradeRecordBody;
    const gradeContext = await getAssignedCourseForSubject({
      subject: body.subject,
      userId: req.userId,
      res,
    });

    if (!gradeContext) return;

    const student = await prisma.seminaryApplication.findUnique({
      where: { id: body.studentApplicationId },
      select: {
        id: true,
        givenName: true,
        middleName: true,
        programCourse: true,
        programLevel: true,
        studentId: true,
        surname: true,
      },
    });

    if (!student?.studentId) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Student not found',
      });
      return;
    }

    const { course, instructorName, user } = gradeContext;
    const record = await prisma.seminaryGradeRecord.create({
      data: {
        recordNumber: await generateGradeRecordNumber(),
        studentApplicationId: student.id,
        studentId: student.studentId,
        studentName: getStudentName(student) || student.studentId,
        program: getProgramLabel(student.programLevel),
        programLevel: student.programLevel,
        subject: body.subject,
        courseId: course.id,
        courseTitle: body.subject,
        courseCode: course.courseCode,
        instructorUserId: user.id,
        instructorName,
        term: body.term,
        finalGrade: body.finalGrade,
        remarks: body.remarks ?? buildGradeRemark(body.finalGrade),
        status: body.status ?? defaultGradeStatus,
        notes: body.notes,
      },
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Grade record created successfully',
      data: toGradeRecordResponse(record),
    });
  } catch (err) {
    logger.error('Error while creating seminary grade record', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
