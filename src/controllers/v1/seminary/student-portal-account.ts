import { Prisma } from '@/generated/prisma/client';
import { UserType } from '@/generated/prisma/enums';
import { hashValue } from '@/lib/password-hash';

export const DEFAULT_SEMINARY_STUDENT_PASSWORD = 'Student123@';

// The User email field remains required by the shared authentication system.
// Seminary students sign in with their student number, not this internal value.
export const getSeminaryStudentPortalEmail = (studentId: string) =>
  `${studentId.trim().toLowerCase()}@students.pearlchaplaincy.local`;

export const getSeminaryStudentName = (student: {
  givenName?: string | null;
  middleName?: string | null;
  surname?: string | null;
  studentId: string;
}) =>
  [student.givenName, student.middleName, student.surname]
    .filter(Boolean)
    .join(' ')
    .trim() || student.studentId;

export const createSeminaryStudentPortalAccount = async (
  tx: Prisma.TransactionClient,
  student: {
    studentId: string;
    givenName?: string | null;
    middleName?: string | null;
    surname?: string | null;
  },
  password = DEFAULT_SEMINARY_STUDENT_PASSWORD,
) =>
  tx.user.create({
    data: {
      name: getSeminaryStudentName(student),
      email: getSeminaryStudentPortalEmail(student.studentId),
      password: await hashValue(password),
      role: UserType.MEMBER,
      isEmailVerified: true,
    },
    select: { id: true },
  });
