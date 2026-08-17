import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { getAssignedCourseForSubject } from './assignment-shared';
import {
  buildGradeRemark,
  defaultGradeStatus,
  getProgramLabel,
  getStudentName,
  toGradeRecordResponse,
} from './grade-record-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryGradeRecordBody } from './types';

export const updateSeminaryGradeRecord = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryGradeRecordBody;
    const existingRecord = await prisma.seminaryGradeRecord.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingRecord) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Grade record not found',
      });
      return;
    }

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
    const record = await prisma.seminaryGradeRecord.update({
      where: { id },
      data: {
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

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Grade record updated successfully',
      data: toGradeRecordResponse(record),
    });
  } catch (err) {
    logger.error('Error while updating seminary grade record', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
