import { SeminaryAcademicYearSession } from '@/generated/prisma/enums';

import type { Prisma } from '@/generated/prisma/client';
import type {
  CreateSeminaryAcademicYearBody,
  UpdateSeminaryAcademicYearBody,
} from './types';

type SeminaryAcademicYearBody =
  | CreateSeminaryAcademicYearBody
  | UpdateSeminaryAcademicYearBody;

export const buildSeminaryAcademicYearData = (
  body: SeminaryAcademicYearBody,
): Prisma.SeminaryAcademicYearUncheckedCreateInput => ({
  academicYear: body.academicYear,
  session: body.session,
  status: body.status,
  startDate: new Date(body.startDate),
  endDate: new Date(body.endDate),
  sortOrder: body.sortOrder ?? 0,
});

export const ensureSingleCurrentAcademicYear = async (
  tx: Prisma.TransactionClient,
  id: string,
  session: SeminaryAcademicYearSession,
) => {
  if (session !== SeminaryAcademicYearSession.CURRENT) return;

  await tx.seminaryAcademicYear.updateMany({
    where: {
      id: { not: id },
      session: SeminaryAcademicYearSession.CURRENT,
    },
    data: {
      session: SeminaryAcademicYearSession.PREVIOUS,
    },
  });
};
