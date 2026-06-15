import { z } from 'zod';
import {
  CivilStatus,
  Gender,
  SeminaryApplicationStatus,
  SeminaryPaymentMethod,
  SeminaryPaymentType,
  SeminaryProgramLevel,
} from '@/generated/prisma/enums';

const optionalText = (max = 255) => z.string().trim().max(max).optional();
const optionalUrl = z.preprocess((value) => {
  if (typeof value !== 'string') return value;

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}, z.url().optional());

const normalizeEnumValue = <T extends Record<string, string>>(
  enumObject: T,
  labels: Record<string, T[keyof T]>,
) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;

    const normalized = value.trim();
    return labels[normalized] ?? normalized;
  }, z.enum(enumObject));

const programLevelSchema = normalizeEnumValue(SeminaryProgramLevel, {
  Certificate: SeminaryProgramLevel.CERTIFICATE,
  Bachelor: SeminaryProgramLevel.BACHELOR,
  'Master with Thesis': SeminaryProgramLevel.MASTER_WITH_THESIS,
  'Doctorate with Dissertation':
    SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
});

const paymentTypeSchema = normalizeEnumValue(SeminaryPaymentType, {
  'Full Payment': SeminaryPaymentType.FULL_PAYMENT,
  'Partial Payment': SeminaryPaymentType.PARTIAL_PAYMENT,
});

const paymentMethodSchema = normalizeEnumValue(SeminaryPaymentMethod, {
  'Bank Deposit / Bank Transfer': SeminaryPaymentMethod.BANK_TRANSFER,
  'Bank Transfer': SeminaryPaymentMethod.BANK_TRANSFER,
  GCash: SeminaryPaymentMethod.GCASH,
  Maya: SeminaryPaymentMethod.MAYA,
});

const genderSchema = normalizeEnumValue(Gender, {
  Male: Gender.MALE,
  Female: Gender.FEMALE,
  'Prefer not to say': Gender.PREFER_NOT_TO_SAY,
});

const civilStatusSchema = normalizeEnumValue(CivilStatus, {
  Single: CivilStatus.SINGLE,
  Married: CivilStatus.MARRIED,
  Widowed: CivilStatus.WIDOWED,
  Separated: CivilStatus.SEPARATED,
  Annulled: CivilStatus.ANNULLED,
});

const dateStringSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'dateOfBirth must be a valid date',
  });

const fileMetadataSchema = z.object({
  fileUrl: optionalUrl,
  fileName: optionalText(),
  mimeType: optionalText(100),
  fileSize: optionalText(50),
});

export const upsertCurrentSeminaryApplicationSchema = z.object({
  personalInformation: z.object({
    academicYear: optionalText(50),
    surname: z.string().trim().min(1).max(100),
    givenName: z.string().trim().min(1).max(100),
    middleName: optionalText(100),
    emailAddress: z.email().optional().or(z.literal('')),
    mobilePhone: optionalText(30),
    homeAddress: optionalText(255),
    dateOfBirth: dateStringSchema,
    birthPlace: optionalText(150),
    age: z.string().trim().optional().or(z.number().optional()),
    gender: genderSchema.optional().or(z.literal('')),
    height: optionalText(30),
    weight: optionalText(30),
    civilStatus: civilStatusSchema.optional().or(z.literal('')),
    officePhone: optionalText(30),
  }),
  ministry: z.object({
    churchAttended: optionalText(150),
    churchAddress: optionalText(255),
    pastorName: optionalText(150),
    contactNumber: optionalText(30),
    ministryInvolved: optionalText(255),
  }),
  curriculum: z.object({
    programLevel: programLevelSchema,
    programCourse: z.string().trim().min(1).max(150),
  }),
  educationalBackground: z.object({
    highSchool: optionalText(150),
    highSchoolYearGraduated: optionalText(50),
    collegeSchool: optionalText(150),
    collegeCourse: optionalText(150),
    collegeYearGraduated: optionalText(50),
    vocationalSchool: optionalText(150),
    vocationalCourse: optionalText(150),
    vocationalYearGraduated: optionalText(50),
    othersSchool: optionalText(150),
    othersCourse: optionalText(150),
    othersYearGraduated: optionalText(50),
  }),
  requirements: z.object({
    transcriptOfRecords: fileMetadataSchema.optional(),
    transcriptOfRecordsUrl: optionalUrl,
    transcriptOfRecordsFileName: optionalText(),
    transcriptOfRecordsMimeType: optionalText(100),
    transcriptOfRecordsFileSize: optionalText(50),
    idPicture: fileMetadataSchema.optional(),
    idPictureUrl: optionalUrl,
    idPictureFileName: optionalText(),
    idPictureMimeType: optionalText(100),
    idPictureFileSize: optionalText(50),
    pastorRecommendation: fileMetadataSchema.optional(),
    pastorRecommendationUrl: optionalUrl,
    pastorRecommendationFileName: optionalText(),
    pastorRecommendationMimeType: optionalText(100),
    pastorRecommendationFileSize: optionalText(50),
    briefHistoryOfConversion: optionalText(5000),
  }),
  payment: z.object({
    type: paymentTypeSchema,
    method: paymentMethodSchema,
    amountPaid: z.coerce.number().positive(),
    totalAmountDue: z
      .union([z.coerce.number().positive(), z.string().trim()])
      .optional(),
    proofOfReceipt: fileMetadataSchema.optional(),
    proofOfReceiptUrl: optionalUrl,
    proofOfReceiptFileName: optionalText(),
    proofOfReceiptMimeType: optionalText(100),
    proofOfReceiptFileSize: optionalText(50),
  }),
});

export const getSeminaryApplicationByIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const getAllSeminaryApplicationsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), {
        message: 'page must be a positive integer',
      }),
    limit: z
      .string()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), {
        message: 'limit must be a positive integer',
      }),
    status: z.enum(SeminaryApplicationStatus).optional(),
    search: optionalText(100),
  }),
});

export const updateSeminaryApplicationStatusSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z
    .object({
      status: z.enum(SeminaryApplicationStatus).refine(
        (value) =>
          value === SeminaryApplicationStatus.UNDER_REVIEW ||
          value === SeminaryApplicationStatus.APPROVED ||
          value === SeminaryApplicationStatus.REJECTED,
        {
          message: 'status must be UNDER_REVIEW, APPROVED, or REJECTED',
        },
      ),
      reviewRemarks: optionalText(1000),
    })
    .refine(
      (body) =>
        body.status !== SeminaryApplicationStatus.REJECTED ||
        Boolean(body.reviewRemarks?.trim()),
      {
        message: 'A rejection reason is required when rejecting an application',
        path: ['reviewRemarks'],
      },
    ),
});
