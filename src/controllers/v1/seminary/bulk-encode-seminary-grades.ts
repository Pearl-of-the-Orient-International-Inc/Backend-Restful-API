import { HTTPSTATUS } from '@/common/http-codes';
import { SeminaryGradeRecordRemark, SeminaryGradeRecordStatus, SeminaryCourseStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { generateGradeRecordNumber, getProgramLabel, getStudentName } from './grade-record-shared';

import type { Request, Response } from 'express';
import type { BulkEncodeSeminaryGradesBody } from './types';

const percentage = (earned: number, total: number) => Math.max(0, Math.min(100, (earned / total) * 100));

const rangeFor = (range: string) => {
  const values = range.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  return range.toLowerCase().includes('below')
    ? { min: 0, max: (values[0] ?? 75) - 0.01 }
    : { min: values[0] ?? 0, max: values[1] ?? values[0] ?? 100 };
};

export const bulkEncodeSeminaryGrades = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as BulkEncodeSeminaryGradesBody;
    const userId = req.userId;
    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }
    const [course, user, configuration, students] = await Promise.all([
      prisma.seminaryCourse.findFirst({
        where: { status: SeminaryCourseStatus.ACTIVE, subjects: { array_contains: [{ subjectName: body.subject }] } },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, seminaryInstructor: { select: { name: true } } } }),
      prisma.seminaryGradeConfiguration.findUnique({ where: { id: 'default' } }),
      prisma.seminaryApplication.findMany({ where: { id: { in: body.entries.map((entry) => entry.studentApplicationId) } }, select: { id: true, studentId: true, givenName: true, middleName: true, surname: true, programLevel: true } }),
    ]);
    if (!course || !user) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'Subject or instructor not found' });
      return;
    }
    const studentById = new Map(students.filter((student) => student.studentId).map((student) => [student.id, student]));
    if (studentById.size !== body.entries.length) {
      res.status(HTTPSTATUS.NOT_FOUND).json({ code: 'NOT_FOUND', message: 'One or more students were not found' });
      return;
    }
    const weights = (configuration?.criteriaWeights ?? { attendance: 20, coursework: 25, character: 30, exam: 25 }) as { attendance: number; coursework: number; character: number; exam: number };
    const scale = (configuration?.gradeScale ?? []) as Array<{ equivalent: string; percentageRange: string }>;
    const passingEquivalent = Number(configuration?.passingEquivalent ?? '2.50');
    const instructorName = user.seminaryInstructor?.name ?? user.name;
    const records = await prisma.$transaction(async (tx) => Promise.all(body.entries.map(async (entry) => {
      const student = studentById.get(entry.studentApplicationId)!;
      const weightedPercentage = (percentage(entry.attendanceEarned, entry.attendanceTotal) * weights.attendance + percentage(entry.courseworkEarned, entry.courseworkTotal) * weights.coursework + percentage(entry.characterEarned, entry.characterTotal) * weights.character + percentage(entry.examEarned, entry.examTotal) * weights.exam) / 100;
      const finalGrade = scale.find((row) => { const range = rangeFor(row.percentageRange); return weightedPercentage >= range.min && weightedPercentage <= range.max; })?.equivalent ?? (weightedPercentage >= 75 ? '3.00' : '5.00');
      const gradeNumber = Number(finalGrade);
      const remarks = gradeNumber <= passingEquivalent ? SeminaryGradeRecordRemark.PASSED : gradeNumber < 5 ? SeminaryGradeRecordRemark.CONDITIONAL : SeminaryGradeRecordRemark.FAILED;
      const data = {
        studentId: student.studentId!, studentName: getStudentName(student) || student.studentId!, program: getProgramLabel(student.programLevel), programLevel: student.programLevel,
        subject: body.subject, courseId: course.id, courseTitle: body.subject, courseCode: course.courseCode, instructorUserId: user.id, instructorName, term: 'Final',
        attendanceEarned: entry.attendanceEarned, attendanceTotal: entry.attendanceTotal, courseworkEarned: entry.courseworkEarned, courseworkTotal: entry.courseworkTotal, characterEarned: entry.characterEarned, characterTotal: entry.characterTotal, examEarned: entry.examEarned, examTotal: entry.examTotal, weightedPercentage,
        finalGrade, remarks, status: SeminaryGradeRecordStatus.PENDING_REVIEW, notes: `Encoded from raw points using the active grade configuration.`,
      };
      const existing = await tx.seminaryGradeRecord.findFirst({ where: { studentApplicationId: student.id, subject: body.subject, term: 'Final' }, select: { id: true } });
      return existing ? tx.seminaryGradeRecord.update({ where: { id: existing.id }, data }) : tx.seminaryGradeRecord.create({ data: { ...data, recordNumber: await generateGradeRecordNumber(), studentApplicationId: student.id } });
    })));
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Grades encoded successfully', data: records });
  } catch (err) {
    logger.error('Error while bulk encoding seminary grades', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to encode grades' });
  }
};
