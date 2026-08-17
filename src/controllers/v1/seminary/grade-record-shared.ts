import { randomBytes } from 'node:crypto';

import { Prisma } from '@/generated/prisma/client';
import { SeminaryGradeRecordRemark, SeminaryGradeRecordStatus, UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

const programLabels: Record<string, string> = {
  BACHELOR: 'Bachelor',
  CERTIFICATE: 'Certificate',
  DOCTORATE_WITH_DISSERTATION: 'Doctorate',
  MASTER_WITH_THESIS: 'Masteral',
};

export const getGradeRecordWhereForUser = async (
  userId: string | undefined,
): Promise<Prisma.SeminaryGradeRecordWhereInput> => {
  if (!userId) return {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== UserType.INSTRUCTOR) return {};

  return { instructorUserId: userId };
};

export const toGradeRecordResponse = <T>(record: T) => record;

export const getStudentName = (student: {
  givenName: string | null;
  middleName: string | null;
  surname: string | null;
}) =>
  [student.givenName, student.middleName, student.surname]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

export const getProgramLabel = (program?: string | null) =>
  program ? programLabels[program] ?? program : 'Certificate';

export const buildGradeRemark = (finalGrade: string) => {
  const grade = Number(finalGrade);
  if (!Number.isFinite(grade)) return SeminaryGradeRecordRemark.ONGOING;
  if (grade <= 2.5) return SeminaryGradeRecordRemark.PASSED;
  if (grade < 5) return SeminaryGradeRecordRemark.CONDITIONAL;
  return SeminaryGradeRecordRemark.FAILED;
};

export const defaultGradeStatus = SeminaryGradeRecordStatus.PENDING_REVIEW;

export const generateGradeRecordNumber = async () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `POTSC-GR-${year}-${timestamp}-${suffix}`;
};
