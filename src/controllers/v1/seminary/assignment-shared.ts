import { HTTPSTATUS } from '@/common/http-codes';
import {
  SeminaryAssignmentStatus,
  SeminaryCourseStatus,
  SeminaryStudentNotificationType,
  SeminaryStudentStatus,
  UserType,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { getSeminaryStudentLmsScope } from './lms-student-scope';

import type { Prisma } from '@/generated/prisma/client';
import type { Response } from 'express';

type CourseSubject = {
  professor?: string;
  subjectName?: string;
};

export const toAssignmentResponse = <T extends { totalMarks: number }>(
  assignment: T,
) => ({
  ...assignment,
  totalMarks: String(assignment.totalMarks),
});

const toCourseSubjects = (value: unknown): CourseSubject[] =>
  Array.isArray(value) ? (value as CourseSubject[]) : [];

export const getAssignedCourseForSubject = async ({
  subject,
  userId,
  res,
}: {
  subject: string;
  userId: string | undefined;
  res: Response;
}) => {
  if (!userId) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      seminaryInstructor: {
        select: { name: true },
      },
    },
  });

  if (!user) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({
      code: 'UNAUTHORIZED',
      message: 'User not found',
    });
    return null;
  }

  const courses = await prisma.seminaryCourse.findMany({
    where: { status: SeminaryCourseStatus.ACTIVE },
  });
  const instructorName = user.seminaryInstructor?.name ?? user.name;
  const course = courses.find((candidate) =>
    toCourseSubjects(candidate.subjects).some(
      (courseSubject) =>
        courseSubject.subjectName === subject &&
        (user.role !== UserType.INSTRUCTOR ||
          courseSubject.professor?.toLowerCase() ===
            instructorName.toLowerCase()),
    ),
  );

  if (!course) {
    res.status(HTTPSTATUS.FORBIDDEN).json({
      code: 'FORBIDDEN',
      message: 'Subject is not assigned to this instructor',
    });
    return null;
  }

  return { course, user, instructorName };
};

export const createAssignmentStudentNotifications = async ({
  assignmentId,
  course,
  title,
  subject,
}: {
  assignmentId: string;
  course: {
    courseName: string;
    courseCode: string;
    program: unknown;
  };
  title: string;
  subject: string;
}) => {
  await prisma.seminaryStudentNotification.deleteMany({
    where: { assignmentId },
  });

  const students = await prisma.seminaryApplication.findMany({
    where: {
      studentId: { not: null },
      studentStatus: SeminaryStudentStatus.ACTIVE,
      programLevel: course.program as Prisma.SeminaryApplicationWhereInput['programLevel'],
      OR: [
        { programCourse: null },
        { programCourse: course.courseName },
        { programCourse: course.courseCode },
      ],
    },
    select: {
      id: true,
      studentId: true,
      surname: true,
      givenName: true,
      emailAddress: true,
    },
  });

  if (students.length === 0) return;

  await prisma.seminaryStudentNotification.createMany({
    data: students.map((student) => ({
      assignmentId,
      studentApplicationId: student.id,
      studentId: student.studentId,
      studentName:
        [student.givenName, student.surname].filter(Boolean).join(' ') ||
        student.studentId ||
        'Student',
      studentEmail: student.emailAddress,
      title: `New assignment: ${title}`,
      message: `A new assignment for ${subject} has been posted.`,
      type: SeminaryStudentNotificationType.ASSIGNMENT,
    })),
  });
};

export const removeAssignmentStudentNotifications = async (assignmentId: string) =>
  prisma.seminaryStudentNotification.deleteMany({ where: { assignmentId } });

export const getAssignmentWhereForUser = async (
  userId: string | undefined,
): Promise<Prisma.SeminaryAssignmentWhereInput> => {
  if (!userId) return {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === UserType.MEMBER) {
    const scope = await getSeminaryStudentLmsScope(userId);
    return {
      status: SeminaryAssignmentStatus.PUBLISHED,
      courseId: { in: scope.courseIds },
    };
  }

  if (user?.role !== UserType.INSTRUCTOR) return {};

  return { instructorUserId: userId };
};

export const canManageAssignment = async ({
  assignmentId,
  userId,
  res,
}: {
  assignmentId: string;
  userId: string | undefined;
  res: Response;
}) => {
  if (!userId) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return false;
  }

  const [user, assignment] = await prisma.$transaction([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.seminaryAssignment.findUnique({
      where: { id: assignmentId },
      select: { instructorUserId: true },
    }),
  ]);

  if (!assignment) {
    res.status(HTTPSTATUS.NOT_FOUND).json({
      code: 'NOT_FOUND',
      message: 'Assignment not found',
    });
    return false;
  }

  if (!user || (user.role === UserType.INSTRUCTOR && assignment.instructorUserId !== userId)) {
    res.status(HTTPSTATUS.FORBIDDEN).json({
      code: 'FORBIDDEN',
      message: 'You can manage only assignments assigned to you',
    });
    return false;
  }

  return true;
};

export const defaultAssignmentStatus = SeminaryAssignmentStatus.DRAFT;
