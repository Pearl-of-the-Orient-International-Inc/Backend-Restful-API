import {
  CivilStatus,
  Gender,
  SeminaryApplicationStatus,
  SeminaryEnrollmentType,
  SeminaryProgramLevel,
  SeminarySchoolAffiliation,
  SeminaryStudentStatus,
} from '@/generated/prisma/enums';

import type { Prisma } from '@/generated/prisma/client';
import type {
  CreateSeminaryStudentBody,
  UpdateSeminaryStudentBody,
} from './types';

type StudentBody = CreateSeminaryStudentBody | UpdateSeminaryStudentBody;

const trimToNull = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const normalizeRequiredLabeledEnum = <T extends string>(
  value: string | undefined,
  labels: Record<string, T>,
): T | null => {
  const normalized = value?.trim();
  return normalized ? (labels[normalized] ?? (normalized as T)) : null;
};

const programLevelLabels: Record<string, SeminaryProgramLevel> = {
  Certificate: SeminaryProgramLevel.CERTIFICATE,
  Bachelor: SeminaryProgramLevel.BACHELOR,
  Masteral: SeminaryProgramLevel.MASTER_WITH_THESIS,
  Doctorate: SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
};

const enrollmentTypeLabels: Record<string, SeminaryEnrollmentType> = {
  Regular: SeminaryEnrollmentType.REGULAR,
  Transferee: SeminaryEnrollmentType.TRANSFEREE,
  'Cross Enrollee': SeminaryEnrollmentType.CROSS_ENROLLEE,
};

const schoolAffiliationLabels: Record<string, SeminarySchoolAffiliation> = {
  'In-House': SeminarySchoolAffiliation.IN_HOUSE,
  'In House': SeminarySchoolAffiliation.IN_HOUSE,
  'Partner School': SeminarySchoolAffiliation.PARTNER_SCHOOL,
};

const studentStatusLabels: Record<string, SeminaryStudentStatus> = {
  Active: SeminaryStudentStatus.ACTIVE,
  Graduating: SeminaryStudentStatus.GRADUATING,
  'Leave of Absence': SeminaryStudentStatus.LEAVE_OF_ABSENCE,
  Inactive: SeminaryStudentStatus.INACTIVE,
};

const genderLabels: Record<string, Gender> = {
  M: Gender.MALE,
  Male: Gender.MALE,
  F: Gender.FEMALE,
  Female: Gender.FEMALE,
  'Prefer not to say': Gender.PREFER_NOT_TO_SAY,
};

const civilStatusLabels: Record<string, CivilStatus> = {
  Single: CivilStatus.SINGLE,
  single: CivilStatus.SINGLE,
  Married: CivilStatus.MARRIED,
  married: CivilStatus.MARRIED,
  Widow: CivilStatus.WIDOWED,
  widow: CivilStatus.WIDOWED,
  Widowed: CivilStatus.WIDOWED,
  widowed: CivilStatus.WIDOWED,
  Separated: CivilStatus.SEPARATED,
  separated: CivilStatus.SEPARATED,
  Annulled: CivilStatus.ANNULLED,
  annulled: CivilStatus.ANNULLED,
};

export const buildSeminaryStudentData = (
  body: StudentBody,
): Prisma.SeminaryApplicationUncheckedCreateInput => ({
  academicYear: trimToNull(body.academicYear),
  surname: trimToNull(body.surname),
  givenName: trimToNull(body.givenName),
  middleName: trimToNull(body.middleName),
  emailAddress: trimToNull(body.emailAddress),
  mobilePhone: trimToNull(body.mobilePhone),
  homeAddress: trimToNull(body.homeAddress),
  birthPlace: trimToNull(body.birthPlace),
  gender: normalizeRequiredLabeledEnum(body.gender, genderLabels),
  civilStatus: normalizeRequiredLabeledEnum(
    body.civilStatus,
    civilStatusLabels,
  ),
  churchAttended: trimToNull(body.churchAttended),
  churchAddress: trimToNull(body.churchAddress),
  pastorName: trimToNull(body.pastorName),
  contactNumber: trimToNull(body.contactNumber),
  ministryInvolved: trimToNull(body.ministryInvolved),
  programLevel: normalizeRequiredLabeledEnum(
    body.programLevel,
    programLevelLabels,
  ),
  programCourse: trimToNull(body.programCourse),
  enrollmentType:
    normalizeRequiredLabeledEnum(body.enrollmentType, enrollmentTypeLabels) ??
    SeminaryEnrollmentType.REGULAR,
  schoolAffiliation:
    normalizeRequiredLabeledEnum(
      body.schoolAffiliation,
      schoolAffiliationLabels,
    ) ?? SeminarySchoolAffiliation.IN_HOUSE,
  yearLevel: trimToNull(body.yearLevel),
  studentStatus:
    normalizeRequiredLabeledEnum(body.studentStatus, studentStatusLabels) ??
    SeminaryStudentStatus.ACTIVE,
  status: SeminaryApplicationStatus.APPROVED,
  reviewedAt: new Date(),
  submittedAt: new Date(),
});

export const buildNextStudentId = async (
  tx: Prisma.TransactionClient,
  date = new Date(),
) => {
  const yearSuffix = String(date.getFullYear()).slice(-2);
  const prefix = `POTSC-${yearSuffix}-`;
  const latestApplication = await tx.seminaryApplication.findFirst({
    where: {
      studentId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      studentId: 'desc',
    },
    select: {
      studentId: true,
    },
  });
  const latestSeries = latestApplication?.studentId
    ? Number.parseInt(latestApplication.studentId.slice(prefix.length), 10)
    : 0;
  const nextSeries = Number.isFinite(latestSeries) ? latestSeries + 1 : 1;

  return `${prefix}${String(nextSeries).padStart(4, '0')}`;
};
