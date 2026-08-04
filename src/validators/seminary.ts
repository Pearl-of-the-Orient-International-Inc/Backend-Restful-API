import { z } from 'zod';
import {
  CivilStatus,
  Gender,
  SeminaryAcademicYearSession,
  SeminaryAcademicYearStatus,
  SeminaryApplicationStatus,
  SeminaryCredentialDocumentType,
  SeminaryCourseModality,
  SeminaryCourseStatus,
  SeminaryFeeCollectionStatus,
  SeminaryEnrollmentType,
  SeminaryInstructorRank,
  SeminaryInstructorStatus,
  SeminaryPaymentMethod,
  SeminaryPaymentType,
  SeminaryProgramLevel,
  SeminarySchoolAffiliation,
  SeminaryStudentStatus,
} from '@/generated/prisma/enums';

const optionalText = (max = 255) => z.string().trim().max(max).optional();
const seminaryStudentIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(60)
  .regex(/^[A-Za-z0-9-]+$/, {
    message: 'studentId may only contain letters, numbers, and hyphens',
  });
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
  Masteral: SeminaryProgramLevel.MASTER_WITH_THESIS,
  'Master with Thesis': SeminaryProgramLevel.MASTER_WITH_THESIS,
  Doctorate: SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
  'Doctorate with Dissertation':
    SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
});

const studentStatusSchema = normalizeEnumValue(SeminaryStudentStatus, {
  Active: SeminaryStudentStatus.ACTIVE,
  Graduating: SeminaryStudentStatus.GRADUATING,
  'Leave of Absence': SeminaryStudentStatus.LEAVE_OF_ABSENCE,
  Inactive: SeminaryStudentStatus.INACTIVE,
});

const enrollmentTypeSchema = normalizeEnumValue(SeminaryEnrollmentType, {
  Regular: SeminaryEnrollmentType.REGULAR,
  Transferee: SeminaryEnrollmentType.TRANSFEREE,
  'Cross Enrollee': SeminaryEnrollmentType.CROSS_ENROLLEE,
});

const schoolAffiliationSchema = normalizeEnumValue(SeminarySchoolAffiliation, {
  'In-House': SeminarySchoolAffiliation.IN_HOUSE,
  'In House': SeminarySchoolAffiliation.IN_HOUSE,
  'Partner School': SeminarySchoolAffiliation.PARTNER_SCHOOL,
});

const credentialDocumentTypeSchema = normalizeEnumValue(
  SeminaryCredentialDocumentType,
  {
    Diploma: SeminaryCredentialDocumentType.DIPLOMA,
    Certificate: SeminaryCredentialDocumentType.CERTIFICATE,
    Transcript: SeminaryCredentialDocumentType.TRANSCRIPT,
  },
);

const courseModalitySchema = normalizeEnumValue(SeminaryCourseModality, {
  'Face to Face': SeminaryCourseModality.FACE_TO_FACE,
  Online: SeminaryCourseModality.ONLINE,
  Both: SeminaryCourseModality.BOTH,
});

const courseStatusSchema = normalizeEnumValue(SeminaryCourseStatus, {
  Active: SeminaryCourseStatus.ACTIVE,
  Inactive: SeminaryCourseStatus.INACTIVE,
});

const academicYearSessionSchema = normalizeEnumValue(
  SeminaryAcademicYearSession,
  {
    Current: SeminaryAcademicYearSession.CURRENT,
    Previous: SeminaryAcademicYearSession.PREVIOUS,
    Upcoming: SeminaryAcademicYearSession.UPCOMING,
  },
);

const academicYearStatusSchema = normalizeEnumValue(SeminaryAcademicYearStatus, {
  Active: SeminaryAcademicYearStatus.ACTIVE,
  Upcoming: SeminaryAcademicYearStatus.UPCOMING,
  Completed: SeminaryAcademicYearStatus.COMPLETED,
});

const instructorStatusSchema = normalizeEnumValue(SeminaryInstructorStatus, {
  Active: SeminaryInstructorStatus.ACTIVE,
  'Part-time': SeminaryInstructorStatus.PART_TIME,
  'Part Time': SeminaryInstructorStatus.PART_TIME,
  'On Leave': SeminaryInstructorStatus.ON_LEAVE,
  Inactive: SeminaryInstructorStatus.INACTIVE,
});

const instructorRankSchema = normalizeEnumValue(SeminaryInstructorRank, {
  'Adjunct Instructor': SeminaryInstructorRank.ADJUNCT_INSTRUCTOR,
  Lecturer: SeminaryInstructorRank.LECTURER,
  'Assistant Professor': SeminaryInstructorRank.ASSISTANT_PROFESSOR,
  'Associate Professor': SeminaryInstructorRank.ASSOCIATE_PROFESSOR,
  Professor: SeminaryInstructorRank.PROFESSOR,
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

const feeCollectionStatusSchema = normalizeEnumValue(
  SeminaryFeeCollectionStatus,
  {
    Pending: SeminaryFeeCollectionStatus.PENDING,
    'Partially Paid': SeminaryFeeCollectionStatus.PARTIALLY_PAID,
    Paid: SeminaryFeeCollectionStatus.PAID,
    Overdue: SeminaryFeeCollectionStatus.OVERDUE,
  },
);

const genderSchema = normalizeEnumValue(Gender, {
  Male: Gender.MALE,
  male: Gender.MALE,
  Female: Gender.FEMALE,
  female: Gender.FEMALE,
  'Prefer not to say': Gender.PREFER_NOT_TO_SAY,
});

const civilStatusSchema = normalizeEnumValue(CivilStatus, {
  Single: CivilStatus.SINGLE,
  single: CivilStatus.SINGLE,
  Married: CivilStatus.MARRIED,
  married: CivilStatus.MARRIED,
  Widowed: CivilStatus.WIDOWED,
  widowed: CivilStatus.WIDOWED,
  Separated: CivilStatus.SEPARATED,
  separated: CivilStatus.SEPARATED,
  Annulled: CivilStatus.ANNULLED,
  annulled: CivilStatus.ANNULLED,
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
    surname: optionalText(100),
    givenName: optionalText(100),
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
    programLevel: programLevelSchema.optional().or(z.literal('')),
    programCourse: optionalText(150),
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

export const createSeminaryApplicationSchema = z.object({
  body: z.object({
    admissionDate: dateStringSchema,
    academicYear: optionalText(50),
    surname: optionalText(100),
    givenName: optionalText(100),
    middleName: optionalText(100),
    emailAddress: z.email().optional().or(z.literal('')),
    mobilePhone: optionalText(30),
    mailingAddress: optionalText(255),
    homeAddress: optionalText(255),
    dateOfBirth: dateStringSchema,
    birthPlace: optionalText(150),
    age: z.string().trim().optional().or(z.number().optional()),
    gender: genderSchema.optional().or(z.literal('')),
    height: optionalText(30),
    weight: optionalText(30),
    civilStatus: civilStatusSchema.optional().or(z.literal('')),
    officePhone: optionalText(30),
    churchAttended: optionalText(150),
    churchAddress: optionalText(255),
    pastorName: optionalText(150),
    contactNumber: optionalText(30),
    ministryInvolved: optionalText(255),
    programLevel: programLevelSchema.optional().or(z.literal('')),
    programCourse: optionalText(1000),
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
      status: z
        .enum(SeminaryApplicationStatus)
        .refine(
          (value) =>
            value === SeminaryApplicationStatus.UNDER_REVIEW ||
            value === SeminaryApplicationStatus.APPROVED ||
            value === SeminaryApplicationStatus.ENROLLED ||
            value === SeminaryApplicationStatus.REJECTED ||
            value === SeminaryApplicationStatus.CANCELLED,
          {
            message:
              'status must be UNDER_REVIEW, APPROVED, ENROLLED, REJECTED, or CANCELLED',
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

const seminaryStudentBodySchema = z.object({
  studentId: z
    .preprocess(
      (value) => (typeof value === 'string' ? value.toUpperCase() : value),
      seminaryStudentIdSchema,
    )
    .optional()
    .or(z.literal('')),
  academicYear: optionalText(50),
  surname: optionalText(100),
  givenName: optionalText(100),
  middleName: optionalText(100),
  emailAddress: z.email().optional().or(z.literal('')),
  mobilePhone: optionalText(30),
  homeAddress: optionalText(255),
  birthPlace: optionalText(150),
  gender: genderSchema.optional().or(z.literal('')),
  civilStatus: civilStatusSchema.optional().or(z.literal('')),
  churchAttended: optionalText(150),
  churchAddress: optionalText(255),
  pastorName: optionalText(150),
  contactNumber: optionalText(30),
  ministryInvolved: optionalText(255),
  programLevel: programLevelSchema.optional().or(z.literal('')),
  programCourse: optionalText(150),
  enrollmentType: enrollmentTypeSchema.optional().or(z.literal('')),
  schoolAffiliation: schoolAffiliationSchema.optional().or(z.literal('')),
  yearLevel: optionalText(100),
  studentStatus: studentStatusSchema.optional().or(z.literal('')),
});

export const createSeminaryStudentSchema = z.object({
  body: seminaryStudentBodySchema,
});

export const updateSeminaryStudentSchema = z.object({
  params: z.object({
    studentId: seminaryStudentIdSchema,
  }),
  body: seminaryStudentBodySchema,
});

export const getSeminaryStudentByIdSchema = z.object({
  params: z.object({
    studentId: seminaryStudentIdSchema,
  }),
});

export const deleteSeminaryStudentSchema = z.object({
  params: z.object({
    studentId: seminaryStudentIdSchema,
  }),
});

export const getAllSeminaryStudentsSchema = z.object({
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
    search: optionalText(100),
    programLevel: programLevelSchema.optional(),
    studentStatus: studentStatusSchema.optional(),
    schoolAffiliation: schoolAffiliationSchema.optional(),
    academicYear: optionalText(50),
  }),
});

const seminaryCourseIdSchema = z.uuid();

const seminaryCourseBodySchema = z.object({
  courseName: z.string().trim().min(1).max(200),
  courseCode: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
  program: programLevelSchema,
  units: z.coerce.number().int().min(1).max(12),
  modality: courseModalitySchema,
  status: courseStatusSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const getAllSeminaryCoursesSchema = z.object({
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
    search: optionalText(100),
    program: programLevelSchema.optional(),
    modality: courseModalitySchema.optional(),
    status: courseStatusSchema.optional(),
  }),
});

export const createSeminaryCourseSchema = z.object({
  body: seminaryCourseBodySchema,
});

export const updateSeminaryCourseSchema = z.object({
  params: z.object({
    id: seminaryCourseIdSchema,
  }),
  body: seminaryCourseBodySchema,
});

export const updateSeminaryCourseStatusSchema = z.object({
  params: z.object({
    id: seminaryCourseIdSchema,
  }),
  body: z.object({
    status: courseStatusSchema,
  }),
});

export const deleteSeminaryCourseSchema = z.object({
  params: z.object({
    id: seminaryCourseIdSchema,
  }),
});

const seminaryAcademicYearIdSchema = z.uuid();

const academicYearDateSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'date must be a valid date',
  });

const seminaryAcademicYearBodySchema = z
  .object({
    academicYear: z
      .string()
      .trim()
      .min(4)
      .max(20)
      .regex(/^\d{4}-\d{4}$/, {
        message: 'academicYear must use YYYY-YYYY format',
      }),
    session: academicYearSessionSchema,
    status: academicYearStatusSchema,
    startDate: academicYearDateSchema,
    endDate: academicYearDateSchema,
    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((body) => new Date(body.endDate) >= new Date(body.startDate), {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

export const getAllSeminaryAcademicYearsSchema = z.object({
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
    search: optionalText(100),
    session: academicYearSessionSchema.optional(),
    status: academicYearStatusSchema.optional(),
  }),
});

export const createSeminaryAcademicYearSchema = z.object({
  body: seminaryAcademicYearBodySchema,
});

export const updateSeminaryAcademicYearSchema = z.object({
  params: z.object({
    id: seminaryAcademicYearIdSchema,
  }),
  body: seminaryAcademicYearBodySchema,
});

export const updateSeminaryAcademicYearSessionSchema = z.object({
  params: z.object({
    id: seminaryAcademicYearIdSchema,
  }),
  body: z.object({
    session: academicYearSessionSchema,
  }),
});

export const updateSeminaryAcademicYearStatusSchema = z.object({
  params: z.object({
    id: seminaryAcademicYearIdSchema,
  }),
  body: z.object({
    status: academicYearStatusSchema,
  }),
});

export const deleteSeminaryAcademicYearSchema = z.object({
  params: z.object({
    id: seminaryAcademicYearIdSchema,
  }),
});

const seminaryInstructorIdSchema = z.uuid();

const scoreSchema = z.coerce.number().min(0).max(100);
const listTextSchema = z
  .array(z.string().trim().min(1).max(255))
  .min(1)
  .max(50);

const seminaryInstructorBodySchema = z.object({
  name: z.string().trim().min(1).max(150),
  professionalTitle: z.string().trim().min(1).max(150),
  email: z.email(),
  contactNumber: z.string().trim().min(1).max(30),
  teachingPrograms: z.array(programLevelSchema).min(1).max(4),
  rank: instructorRankSchema,
  status: instructorStatusSchema.optional(),
  loadUnits: z.coerce.number().int().min(0).max(60),
  biography: z.string().trim().min(1).max(5000),
  educationalBackground: z.string().trim().min(1).max(5000),
  areasOfExpertise: listTextSchema,
  credentials: listTextSchema,
  formalPhotoUrl: z.string().trim().min(1).max(5_000_000),
  isFilipinoCitizen: z.boolean(),
  highSchoolGraduateOrEquivalent: z.boolean(),
  ministerialExperienceYears: z.coerce.number().int().min(5).max(80),
  submissionDeadline: academicYearDateSchema.optional(),
  evaluation: z.object({
    attendanceParticipation: scoreSchema,
    leadershipCharacter: scoreSchema,
    ministryCommunityEngagement: scoreSchema,
    knowledgeSkillsAssessment: scoreSchema,
    professionalConductEthics: scoreSchema,
  }),
});

export const getAllSeminaryInstructorsSchema = z.object({
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
    search: optionalText(100),
    status: instructorStatusSchema.optional(),
    teachingProgram: programLevelSchema.optional(),
  }),
});

export const getSeminaryInstructorByIdSchema = z.object({
  params: z.object({
    id: seminaryInstructorIdSchema,
  }),
});

export const createSeminaryInstructorSchema = z.object({
  body: seminaryInstructorBodySchema,
});

export const updateSeminaryInstructorSchema = z.object({
  params: z.object({
    id: seminaryInstructorIdSchema,
  }),
  body: seminaryInstructorBodySchema,
});

export const updateSeminaryInstructorStatusSchema = z.object({
  params: z.object({
    id: seminaryInstructorIdSchema,
  }),
  body: z.object({
    status: instructorStatusSchema,
  }),
});

export const deleteSeminaryInstructorSchema = z.object({
  params: z.object({
    id: seminaryInstructorIdSchema,
  }),
});

const gradeScaleRowSchema = z.object({
  equivalent: z.string().trim().min(1).max(20),
  percentageRange: z.string().trim().min(1).max(50),
  remarks: z.string().trim().min(1).max(100),
});

export const updateSeminaryGradeConfigurationSchema = z.object({
  body: z.object({
    passingEquivalent: z.string().trim().min(1).max(20).optional(),
    releaseWindow: z.string().trim().min(1).max(100).optional(),
    weightProfile: z.string().trim().min(1).max(100).optional(),
    completionWindowDays: z.coerce.number().int().min(1).max(365).optional(),
    approvalWorkflow: z.boolean().optional(),
    allowFacultyOverride: z.boolean().optional(),
    autoPublishApproved: z.boolean().optional(),
    showConditionalRemark: z.boolean().optional(),
    gradeScale: z.array(gradeScaleRowSchema).min(1).max(50).optional(),
  }),
});

const feeBreakdownItemSchema = z.object({
  label: z.string().trim().min(1).max(120),
  amount: z.coerce.number().min(0).max(1_000_000),
});

export const updateSeminaryFeeConfigurationSchema = z.object({
  body: z.object({
    feeBreakdowns: z.object({
      Certificate: z.array(feeBreakdownItemSchema).min(1).max(50),
      Bachelor: z.array(feeBreakdownItemSchema).min(1).max(50),
      Masteral: z.array(feeBreakdownItemSchema).min(1).max(50),
      Doctorate: z.array(feeBreakdownItemSchema).min(1).max(50),
    }),
  }),
});

export const getAllSeminaryFeeCollectionsSchema = z.object({
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
    search: optionalText(100),
    programLevel: programLevelSchema.optional(),
    status: feeCollectionStatusSchema.optional(),
  }),
});

export const updateSeminaryFeeCollectionStatusSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    status: feeCollectionStatusSchema,
  }),
});

export const updateSeminaryFeeCollectionPaymentSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    amountPaid: z.coerce.number().min(0).max(1_000_000),
    dueDate: academicYearDateSchema.optional(),
    paymentMethod: z.string().trim().min(1).max(80),
    status: feeCollectionStatusSchema.optional(),
  }),
});

export const bulkImportSeminaryStudentsSchema = z.object({
  body: z.object({
    students: z.array(seminaryStudentBodySchema).min(1).max(1000),
  }),
});

export const bulkDeleteSeminaryStudentsSchema = z.object({
  body: z.object({
    studentIds: z
      .array(seminaryStudentIdSchema)
      .min(1)
      .max(1000),
  }),
});

export const generateSeminaryCredentialDocumentSchema = z.object({
  params: z.object({
    studentId: seminaryStudentIdSchema,
  }),
  body: z.object({
    type: credentialDocumentTypeSchema,
    title: optionalText(150),
    remarks: optionalText(1000),
  }),
});

export const getSeminaryCredentialDocumentsSchema = z.object({
  params: z.object({
    studentId: seminaryStudentIdSchema,
  }),
  query: z.object({
    type: credentialDocumentTypeSchema.optional(),
  }),
});

export const getSeminaryCredentialDocumentByNumberSchema = z.object({
  params: z.object({
    documentNumber: z.string().trim().min(3).max(50),
  }),
});

export const verifySeminaryCredentialDocumentSchema = z.object({
  params: z.object({
    token: z.string().trim().min(16).max(128),
  }),
});
