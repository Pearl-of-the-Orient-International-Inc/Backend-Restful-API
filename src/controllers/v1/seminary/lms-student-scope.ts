import { SeminaryCourseStatus, SeminaryStudentStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

type CourseSubject = {
  subjectName?: string;
};

const toCourseSubjects = (value: unknown): CourseSubject[] =>
  Array.isArray(value) ? (value as CourseSubject[]) : [];

/**
 * Returns the active course and subject scope for the currently signed-in
 * student. LMS content is always attached to a course (or its subject), so a
 * student must never receive material from another programme or course.
 */
export const getSeminaryStudentLmsScope = async (userId: string) => {
  const student = await prisma.seminaryApplication.findFirst({
    where: {
      studentId: { not: null },
      studentStatus: SeminaryStudentStatus.ACTIVE,
      OR: [{ portalUserId: userId }, { member: { userId } }],
    },
    orderBy: { updatedAt: 'desc' },
    select: { programLevel: true, programCourse: true },
  });

  if (!student?.programLevel) {
    return { courseIds: [], subjectNames: [] };
  }

  const courses = await prisma.seminaryCourse.findMany({
    where: {
      status: SeminaryCourseStatus.ACTIVE,
      program: student.programLevel,
      ...(student.programCourse
        ? {
            OR: [
              { courseName: student.programCourse },
              { courseCode: student.programCourse },
            ],
          }
        : {}),
    },
    select: { id: true, subjects: true },
  });

  return {
    courseIds: courses.map((course) => course.id),
    subjectNames: Array.from(
      new Set(
        courses
          .flatMap((course) => toCourseSubjects(course.subjects))
          .map((subject) => subject.subjectName)
          .filter((subject): subject is string => Boolean(subject)),
      ),
    ),
  };
};
