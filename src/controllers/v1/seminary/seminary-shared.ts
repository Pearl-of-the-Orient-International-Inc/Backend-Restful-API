import { Prisma } from '@/generated/prisma/client';
import {
  CivilStatus,
  Gender,
  SeminaryApplicationStatus,
  SeminaryPaymentMethod,
  SeminaryPaymentType,
  SeminaryProgramLevel,
} from '@/generated/prisma/enums';
import type { UpsertCurrentSeminaryApplicationBody } from './types';

export const seminaryApplicationInclude = {
  member: {
    select: {
      id: true,
      uniqueId: true,
      memberType: true,
      status: true,
      firstName: true,
      lastName: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  requirements: true,
  payment: true,
} satisfies Prisma.SeminaryApplicationInclude;

export type SeminaryApplicationWithDetails = Prisma.SeminaryApplicationGetPayload<{
  include: typeof seminaryApplicationInclude;
}>;

const trimToNull = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const normalizeLabeledEnum = <T extends string>(
  value: string | undefined | null,
  labels: Record<string, T>,
): T | null => {
  const normalized = value?.trim();
  if (!normalized) return null;

  return labels[normalized] ?? (normalized as T);
};

const normalizeRequiredLabeledEnum = <T extends string>(
  value: string,
  labels: Record<string, T>,
): T => normalizeLabeledEnum(value, labels) as T;

const genderLabels: Record<string, Gender> = {
  Male: Gender.MALE,
  Female: Gender.FEMALE,
  'Prefer not to say': Gender.PREFER_NOT_TO_SAY,
};

const civilStatusLabels: Record<string, CivilStatus> = {
  Single: CivilStatus.SINGLE,
  Married: CivilStatus.MARRIED,
  Widowed: CivilStatus.WIDOWED,
  Separated: CivilStatus.SEPARATED,
  Annulled: CivilStatus.ANNULLED,
};

const programLevelLabels: Record<string, SeminaryProgramLevel> = {
  Certificate: SeminaryProgramLevel.CERTIFICATE,
  Bachelor: SeminaryProgramLevel.BACHELOR,
  'Master with Thesis': SeminaryProgramLevel.MASTER_WITH_THESIS,
  'Doctorate with Dissertation':
    SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
};

const paymentTypeLabels: Record<string, SeminaryPaymentType> = {
  'Full Payment': SeminaryPaymentType.FULL_PAYMENT,
  'Partial Payment': SeminaryPaymentType.PARTIAL_PAYMENT,
};

const paymentMethodLabels: Record<string, SeminaryPaymentMethod> = {
  'Bank Deposit / Bank Transfer': SeminaryPaymentMethod.BANK_TRANSFER,
  'Bank Transfer': SeminaryPaymentMethod.BANK_TRANSFER,
  GCash: SeminaryPaymentMethod.GCASH,
  Maya: SeminaryPaymentMethod.MAYA,
};

const parseAge = (value?: string | number | null): number | null => {
  if (value === null || value === undefined || value === '') return null;

  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseMoney = (value?: string | number): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2);
  }

  const normalized = typeof value === 'string' ? value.replace(/[^\d.]/g, '') : '';
  const parsed = Number.parseFloat(normalized ?? '');
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
};

export const buildSeminaryApplicationData = (
  body: UpsertCurrentSeminaryApplicationBody,
) => ({
  academicYear: trimToNull(body.personalInformation.academicYear),
  surname: body.personalInformation.surname.trim(),
  givenName: body.personalInformation.givenName.trim(),
  middleName: trimToNull(body.personalInformation.middleName),
  emailAddress: trimToNull(body.personalInformation.emailAddress),
  mobilePhone: trimToNull(body.personalInformation.mobilePhone),
  homeAddress: trimToNull(body.personalInformation.homeAddress),
  dateOfBirth: parseDate(body.personalInformation.dateOfBirth),
  birthPlace: trimToNull(body.personalInformation.birthPlace),
  age: parseAge(body.personalInformation.age),
  gender: normalizeLabeledEnum(
    body.personalInformation.gender,
    genderLabels,
  ),
  height: trimToNull(body.personalInformation.height),
  weight: trimToNull(body.personalInformation.weight),
  civilStatus: normalizeLabeledEnum(
    body.personalInformation.civilStatus,
    civilStatusLabels,
  ),
  officePhone: trimToNull(body.personalInformation.officePhone),
  churchAttended: trimToNull(body.ministry.churchAttended),
  churchAddress: trimToNull(body.ministry.churchAddress),
  pastorName: trimToNull(body.ministry.pastorName),
  contactNumber: trimToNull(body.ministry.contactNumber),
  ministryInvolved: trimToNull(body.ministry.ministryInvolved),
  programLevel: normalizeRequiredLabeledEnum(
    body.curriculum.programLevel,
    programLevelLabels,
  ),
  programCourse: body.curriculum.programCourse.trim(),
  highSchool: trimToNull(body.educationalBackground.highSchool),
  highSchoolYearGraduated: trimToNull(
    body.educationalBackground.highSchoolYearGraduated,
  ),
  collegeSchool: trimToNull(body.educationalBackground.collegeSchool),
  collegeCourse: trimToNull(body.educationalBackground.collegeCourse),
  collegeYearGraduated: trimToNull(
    body.educationalBackground.collegeYearGraduated,
  ),
  vocationalSchool: trimToNull(body.educationalBackground.vocationalSchool),
  vocationalCourse: trimToNull(body.educationalBackground.vocationalCourse),
  vocationalYearGraduated: trimToNull(
    body.educationalBackground.vocationalYearGraduated,
  ),
  othersSchool: trimToNull(body.educationalBackground.othersSchool),
  othersCourse: trimToNull(body.educationalBackground.othersCourse),
  othersYearGraduated: trimToNull(
    body.educationalBackground.othersYearGraduated,
  ),
  status: 'SUBMITTED' as SeminaryApplicationStatus,
  targetMemberType: 'PROFESSIONAL_CHAPLAIN' as const,
  submittedAt: new Date(),
});

export const buildSeminaryRequirementsData = (
  body: UpsertCurrentSeminaryApplicationBody,
) => ({
  transcriptOfRecordsUrl: trimToNull(
    body.requirements.transcriptOfRecords?.fileUrl ??
      body.requirements.transcriptOfRecordsUrl,
  ),
  transcriptOfRecordsFileName: trimToNull(
    body.requirements.transcriptOfRecords?.fileName ??
      body.requirements.transcriptOfRecordsFileName,
  ),
  transcriptOfRecordsMimeType: trimToNull(
    body.requirements.transcriptOfRecords?.mimeType ??
      body.requirements.transcriptOfRecordsMimeType,
  ),
  transcriptOfRecordsFileSize: trimToNull(
    body.requirements.transcriptOfRecords?.fileSize ??
      body.requirements.transcriptOfRecordsFileSize,
  ),
  idPictureUrl: trimToNull(
    body.requirements.idPicture?.fileUrl ?? body.requirements.idPictureUrl,
  ),
  idPictureFileName: trimToNull(
    body.requirements.idPicture?.fileName ??
      body.requirements.idPictureFileName,
  ),
  idPictureMimeType: trimToNull(
    body.requirements.idPicture?.mimeType ??
      body.requirements.idPictureMimeType,
  ),
  idPictureFileSize: trimToNull(
    body.requirements.idPicture?.fileSize ??
      body.requirements.idPictureFileSize,
  ),
  pastorRecommendationUrl: trimToNull(
    body.requirements.pastorRecommendation?.fileUrl ??
      body.requirements.pastorRecommendationUrl,
  ),
  pastorRecommendationFileName: trimToNull(
    body.requirements.pastorRecommendation?.fileName ??
      body.requirements.pastorRecommendationFileName,
  ),
  pastorRecommendationMimeType: trimToNull(
    body.requirements.pastorRecommendation?.mimeType ??
      body.requirements.pastorRecommendationMimeType,
  ),
  pastorRecommendationFileSize: trimToNull(
    body.requirements.pastorRecommendation?.fileSize ??
      body.requirements.pastorRecommendationFileSize,
  ),
  briefHistoryOfConversion: trimToNull(
    body.requirements.briefHistoryOfConversion,
  ),
});

export const buildSeminaryPaymentData = (
  body: UpsertCurrentSeminaryApplicationBody,
) => ({
  paymentType: normalizeRequiredLabeledEnum(
    body.payment.type,
    paymentTypeLabels,
  ),
  paymentMethod: normalizeRequiredLabeledEnum(
    body.payment.method,
    paymentMethodLabels,
  ),
  amountPaid: parseMoney(body.payment.amountPaid),
  totalAmountDue: parseMoney(body.payment.totalAmountDue ?? '4500'),
  proofOfReceiptUrl: trimToNull(
    body.payment.proofOfReceipt?.fileUrl ?? body.payment.proofOfReceiptUrl,
  ),
  proofOfReceiptFileName: trimToNull(
    body.payment.proofOfReceipt?.fileName ?? body.payment.proofOfReceiptFileName,
  ),
  proofOfReceiptMimeType: trimToNull(
    body.payment.proofOfReceipt?.mimeType ?? body.payment.proofOfReceiptMimeType,
  ),
  proofOfReceiptFileSize: trimToNull(
    body.payment.proofOfReceipt?.fileSize ?? body.payment.proofOfReceiptFileSize,
  ),
  submittedAt: new Date(),
});
