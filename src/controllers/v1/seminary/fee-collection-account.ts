import { SeminaryProgramLevel } from '@/generated/prisma/enums';

import { defaultFeeBreakdowns } from './fee-configuration-shared';

import type { Prisma } from '@/generated/prisma/client';

type FeeBreakdownItem = { amount: number; label: string };
type FeeBreakdowns = Record<
  'Certificate' | 'Bachelor' | 'Masteral' | 'Doctorate',
  FeeBreakdownItem[]
>;

const programKeys: Record<
  SeminaryProgramLevel,
  keyof FeeBreakdowns
> = {
  [SeminaryProgramLevel.CERTIFICATE]: 'Certificate',
  [SeminaryProgramLevel.BACHELOR]: 'Bachelor',
  [SeminaryProgramLevel.MASTER_WITH_THESIS]: 'Masteral',
  [SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION]: 'Doctorate',
};

const programLabels: Record<SeminaryProgramLevel, string> = {
  [SeminaryProgramLevel.CERTIFICATE]: 'Certificate',
  [SeminaryProgramLevel.BACHELOR]: 'Bachelor',
  [SeminaryProgramLevel.MASTER_WITH_THESIS]: 'Masteral',
  [SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION]: 'Doctorate',
};

const getBreakdowns = (value: unknown): FeeBreakdowns => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultFeeBreakdowns;
  }

  return value as FeeBreakdowns;
};

const getTotal = (items: FeeBreakdownItem[] | undefined) =>
  (items ?? []).reduce(
    (total, item) => total + (Number.isFinite(item.amount) ? item.amount : 0),
    0,
  );

const getStudentName = ({
  givenName,
  middleName,
  surname,
}: {
  givenName?: string | null;
  middleName?: string | null;
  surname?: string | null;
}) =>
  [givenName, middleName, surname].filter(Boolean).join(' ').trim() || 'Student';

/** Creates the initial account once, without overwriting recorded payments. */
export const ensureSeminaryFeeCollectionAccount = async (
  tx: Prisma.TransactionClient,
  student: {
    studentId: string;
    givenName?: string | null;
    middleName?: string | null;
    surname?: string | null;
    programCourse?: string | null;
    programLevel: SeminaryProgramLevel;
  },
) => {
  const configuration = await tx.seminaryFeeConfiguration.findUnique({
    where: { id: 'default' },
    select: { feeBreakdowns: true },
  });
  const breakdowns = getBreakdowns(
    configuration?.feeBreakdowns ?? defaultFeeBreakdowns,
  );
  const totalCharges = getTotal(breakdowns[programKeys[student.programLevel]]);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return tx.seminaryFeeCollectionAccount.upsert({
    where: { studentId: student.studentId },
    create: {
      referenceNumber: `POTSC-FEE-${student.studentId}`,
      studentId: student.studentId,
      studentName: getStudentName(student),
      program:
        student.programCourse?.trim() || programLabels[student.programLevel],
      programLevel: student.programLevel,
      totalCharges,
      amountPaid: 0,
      balance: totalCharges,
      dueDate,
      paymentMethod: 'Cash',
    },
    update: {},
  });
};
