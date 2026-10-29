import { z } from 'zod';
import {
  CivilStatus,
  Gender,
  SeminaryAcademicYearSession,
  SeminaryAcademicYearStatus,
  SeminaryApplicationStatus,
  SeminaryAssignmentStatus,
  SeminaryCredentialDocumentType,
  SeminaryCourseModality,
  SeminaryAnnouncementAudience,
  SeminaryAnnouncementCategory,
  SeminaryAnnouncementKind,
  SeminaryAnnouncementStatus,
  SeminaryCourseScheduleStatus,
  SeminaryCourseStatus,
  SeminaryDocumentDeliveryMethod,
  SeminaryDocumentPaymentStatus,
  SeminaryDocumentRequestStatus,
  SeminaryFeeCollectionStatus,
  SeminaryEnrollmentType,
  SeminaryExaminationStatus,
  SeminaryGradeRecordRemark,
  SeminaryGradeRecordStatus,
  SeminaryInstructorRank,
  SeminaryInstructorStatus,
  SeminaryPaymentMethod,
  SeminaryPaymentType,
  SeminaryProgramLevel,
  SeminarySchoolAffiliation,
  SeminaryStudyMaterialStatus,
  SeminaryStudyMaterialType,
  SeminaryStudentStatus,
} from '@/generated/prisma/enums';
import { passwordSchema } from './auth';

const optionalText = (max = 255) => z.string().trim().max(max).optional();
const optionalNullableText = (max = 255) =>
  z.preprocess(
    (value) => (typeof value === 'string' && !value.trim() ? null : value),
    z.string().trim().max(max).nullable().optional(),
  );
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

const courseScheduleStatusSchema = normalizeEnumValue(
  SeminaryCourseScheduleStatus,
  {
    Draft: SeminaryCourseScheduleStatus.DRAFT,
    Scheduled: SeminaryCourseScheduleStatus.SCHEDULED,
    Cancelled: SeminaryCourseScheduleStatus.CANCELLED,
    Completed: SeminaryCourseScheduleStatus.COMPLETED,
  },
);

const studyMaterialTypeSchema = normalizeEnumValue(SeminaryStudyMaterialType, {
  Notes: SeminaryStudyMaterialType.NOTES,
  Presentation: SeminaryStudyMaterialType.PRESENTATION,
  Document: SeminaryStudyMaterialType.DOCUMENT,
  Chart: SeminaryStudyMaterialType.CHART,
  Archive: SeminaryStudyMaterialType.ARCHIVE,
});

const studyMaterialStatusSchema = normalizeEnumValue(SeminaryStudyMaterialStatus, {
  Published: SeminaryStudyMaterialStatus.PUBLISHED,
  Draft: SeminaryStudyMaterialStatus.DRAFT,
});

const assignmentStatusSchema = normalizeEnumValue(SeminaryAssignmentStatus, {
  Published: SeminaryAssignmentStatus.PUBLISHED,
  Draft: SeminaryAssignmentStatus.DRAFT,
  Scheduled: SeminaryAssignmentStatus.SCHEDULED,
});

const examinationStatusSchema = normalizeEnumValue(SeminaryExaminationStatus, {
  Scheduled: SeminaryExaminationStatus.SCHEDULED,
  Ongoing: SeminaryExaminationStatus.ONGOING,
  Completed: SeminaryExaminationStatus.COMPLETED,
  Draft: SeminaryExaminationStatus.DRAFT,
});

const gradeRecordStatusSchema = normalizeEnumValue(SeminaryGradeRecordStatus, {
  Complete: SeminaryGradeRecordStatus.COMPLETE,
  'Pending Review': SeminaryGradeRecordStatus.PENDING_REVIEW,
  'In Progress': SeminaryGradeRecordStatus.IN_PROGRESS,
  Incomplete: SeminaryGradeRecordStatus.INCOMPLETE,
});

const gradeRecordRemarkSchema = normalizeEnumValue(SeminaryGradeRecordRemark, {
  Passed: SeminaryGradeRecordRemark.PASSED,
  Conditional: SeminaryGradeRecordRemark.CONDITIONAL,
  Failed: SeminaryGradeRecordRemark.FAILED,
  Ongoing: SeminaryGradeRecordRemark.ONGOING,
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
  Widow: CivilStatus.WIDOWED,
  widow: CivilStatus.WIDOWED,
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

export const getPublicSeminaryStudentSchema = z.object({
  params: z.object({
    studentId: seminaryStudentIdSchema,
  }),
});

export const deleteSeminaryStudentSchema = z.object({
  params: z.object({
    studentId: seminaryStudentIdSchema,
  }),
});

export const changeSeminaryStudentPasswordSchema = z.object({
  params: z.object({ studentId: z.string().trim().min(1).max(100) }),
  body: z
    .object({ password: passwordSchema, confirmPassword: passwordSchema })
    .refine((value) => value.password === value.confirmPassword, {
      message: 'Password does not match',
      path: ['confirmPassword'],
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

const seminaryCourseSubjectSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'date must be in YYYY-MM-DD format',
    }),
  subjectName: z.string().trim().min(1).max(200),
  units: z.coerce.number().int().min(1).max(12),
  startTime: z.string().trim().min(1).max(20),
  endTime: z.string().trim().min(1).max(20),
  professor: z.string().trim().min(1).max(150),
  modality: courseModalitySchema,
});

const seminaryCourseBodySchema = z.object({
  courseName: z.string().trim().min(1).max(200),
  courseCode: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
  program: programLevelSchema,
  status: courseStatusSchema.optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  subjects: z.array(seminaryCourseSubjectSchema).min(1).max(50),
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

const scheduleWeekdaySchema = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);
const scheduleTimeSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: 'time must use 24-hour HH:mm format',
});
const scheduleDateSchema = z.coerce.date();
const seminaryCourseScheduleBodySchema = z
  .object({
    // Kept for older records. New schedules use the seminary intake period.
    academicYear: z.string().trim().min(1).max(80),
    period: z.string().trim().min(1).max(80),
    className: z.string().trim().min(1).max(120),
    courseId: z.uuid(),
    instructorId: z.uuid(),
    subjectName: z.string().trim().min(1).max(200),
    units: z.coerce.number().int().min(1).max(12),
    scheduledDate: scheduleDateSchema,
    recurrenceDays: z.array(scheduleWeekdaySchema).max(7).optional(),
    recurrenceEndDate: scheduleDateSchema.optional(),
    startTime: scheduleTimeSchema,
    endTime: scheduleTimeSchema,
    deliveryMode: courseModalitySchema,
    location: optionalText(255),
    meetingLink: optionalUrl,
    status: courseScheduleStatusSchema.optional(),
  })
  .refine((body) => body.startTime < body.endTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  })
;

export const getAllSeminaryCourseSchedulesSchema = z.object({
  query: z.object({
    academicYear: optionalText(20),
    period: optionalText(80),
    className: optionalText(120),
    status: courseScheduleStatusSchema.optional(),
  }),
});

export const createSeminaryCourseScheduleSchema = z.object({
  body: seminaryCourseScheduleBodySchema,
});

export const updateSeminaryCourseScheduleSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: seminaryCourseScheduleBodySchema,
});

export const deleteSeminaryCourseScheduleSchema = z.object({
  params: z.object({ id: z.uuid() }),
});

const documentDeliveryMethodSchema = z.enum(SeminaryDocumentDeliveryMethod);
const documentRequestStatusSchema = z.enum(SeminaryDocumentRequestStatus);
const documentPaymentStatusSchema = z.enum(SeminaryDocumentPaymentStatus);
const documentRequestTypeIdSchema = z.uuid();

export const getSeminaryDocumentRequestTypesSchema = z.object({
  query: z.object({ includeInactive: z.enum(['true', 'false']).optional() }),
});

export const createSeminaryDocumentRequestTypeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    description: optionalText(500),
    fee: z.coerce.number().min(0).max(100000).nullable().optional(),
    requiresSupportingDetails: z.boolean().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  }),
});

export const updateSeminaryDocumentRequestTypeSchema = z.object({
  params: z.object({ id: documentRequestTypeIdSchema }),
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    description: optionalText(500),
    fee: z.coerce.number().min(0).max(100000).nullable().optional(),
    requiresSupportingDetails: z.boolean().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  }),
});

export const getSeminaryDocumentRequestsSchema = z.object({
  query: z.object({
    status: documentRequestStatusSchema.optional(),
    documentTypeId: documentRequestTypeIdSchema.optional(),
  }),
});

export const createSeminaryDocumentRequestSchema = z.object({
  body: z.object({
    documentTypeId: documentRequestTypeIdSchema,
    purpose: z.string().trim().min(3).max(500),
    deliveryMethod: documentDeliveryMethodSchema,
    supportingDetails: optionalText(2000),
  }),
});

export const updateSeminaryDocumentRequestStatusSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    status: documentRequestStatusSchema,
    reviewRemarks: optionalText(1000),
    paymentStatus: documentPaymentStatusSchema.optional(),
    releaseReference: optionalText(255),
    receivedBy: optionalText(255),
  }),
});

const seminaryStudyMaterialIdSchema = z.uuid();

export const getAllSeminaryStudyMaterialsSchema = z.object({
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
    subject: optionalText(200),
    type: studyMaterialTypeSchema.optional(),
    status: studyMaterialStatusSchema.optional(),
  }),
});

export const createSeminaryStudyMaterialSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200),
    subtitle: optionalText(500),
    subject: z.string().trim().min(1).max(200),
    type: studyMaterialTypeSchema,
    status: studyMaterialStatusSchema.optional(),
    fileUrl: z.url(),
    fileName: z.string().trim().min(1).max(255),
    mimeType: optionalText(120),
    fileSize: z.coerce.number().int().min(0).optional(),
  }),
});

export const updateSeminaryStudyMaterialSchema = z.object({
  params: z.object({
    id: seminaryStudyMaterialIdSchema,
  }),
  body: z.object({
    title: z.string().trim().min(1).max(200),
    subtitle: optionalText(500),
    subject: z.string().trim().min(1).max(200),
    type: studyMaterialTypeSchema,
    status: studyMaterialStatusSchema.optional(),
  }),
});

export const deleteSeminaryStudyMaterialSchema = z.object({
  params: z.object({
    id: seminaryStudyMaterialIdSchema,
  }),
});

const seminaryAssignmentIdSchema = z.uuid();

const seminaryAssignmentBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  subject: z.string().trim().min(1).max(200),
  assignmentType: z.string().trim().min(1).max(100),
  dueAt: z.coerce.date(),
  status: assignmentStatusSchema.optional(),
  totalMarks: z.coerce.number().int().min(1).max(10000),
  additionalInstructions: optionalText(4000),
  allowLateSubmission: z.boolean().optional(),
  lateSubmissionDeadline: z.coerce.date().optional(),
  notifyStudents: z.boolean().optional(),
  attachmentLabel: optionalText(500),
});

export const getAllSeminaryAssignmentsSchema = z.object({
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
    subject: optionalText(200),
    status: assignmentStatusSchema.optional(),
  }),
});

export const createSeminaryAssignmentSchema = z.object({
  body: seminaryAssignmentBodySchema,
});

export const updateSeminaryAssignmentSchema = z.object({
  params: z.object({
    id: seminaryAssignmentIdSchema,
  }),
  body: seminaryAssignmentBodySchema,
});

export const updateSeminaryAssignmentStatusSchema = z.object({
  params: z.object({
    id: seminaryAssignmentIdSchema,
  }),
  body: z.object({
    status: assignmentStatusSchema,
  }),
});

export const deleteSeminaryAssignmentSchema = z.object({
  params: z.object({
    id: seminaryAssignmentIdSchema,
  }),
});

const seminaryExaminationIdSchema = z.uuid();

const seminaryExaminationQuestionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
  prompt: z.string().trim().min(1).max(4000),
  points: z.coerce.number().int().min(1).max(1000),
  options: z.array(z.string().trim().min(1).max(500)).max(10).optional(),
  answer: z.string().trim().max(2000).optional(),
});

const seminaryExaminationBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  coverage: z.string().trim().min(1).max(500),
  subject: z.string().trim().min(1).max(200),
  examType: z.string().trim().min(1).max(100),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  status: examinationStatusSchema.optional(),
  totalPoints: z.coerce.number().int().min(1).max(10000),
  passingScore: z.coerce.number().int().min(1).max(10000),
  instructions: optionalText(4000),
  randomizeQuestions: z.boolean().optional(),
  showResults: z.boolean().optional(),
  questions: z.array(seminaryExaminationQuestionSchema).min(1).max(200),
});

export const getAllSeminaryExaminationsSchema = z.object({
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
    subject: optionalText(200),
    status: examinationStatusSchema.optional(),
  }),
});

export const getSeminaryExaminationByIdSchema = z.object({
  params: z.object({
    id: seminaryExaminationIdSchema,
  }),
});

export const createSeminaryExaminationSchema = z.object({
  body: seminaryExaminationBodySchema,
});

export const updateSeminaryExaminationSchema = z.object({
  params: z.object({
    id: seminaryExaminationIdSchema,
  }),
  body: seminaryExaminationBodySchema,
});

export const updateSeminaryExaminationStatusSchema = z.object({
  params: z.object({
    id: seminaryExaminationIdSchema,
  }),
  body: z.object({
    status: examinationStatusSchema,
  }),
});

export const deleteSeminaryExaminationSchema = z.object({
  params: z.object({
    id: seminaryExaminationIdSchema,
  }),
});

const seminaryGradeRecordIdSchema = z.uuid();

const seminaryGradeRecordBodySchema = z.object({
  studentApplicationId: z.uuid(),
  subject: z.string().trim().min(1).max(200),
  term: z.string().trim().min(1).max(80),
  finalGrade: z.string().trim().min(1).max(20),
  remarks: gradeRecordRemarkSchema.optional(),
  status: gradeRecordStatusSchema.optional(),
  notes: optionalText(2000),
});

export const getAllSeminaryGradeRecordsSchema = z.object({
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
    program: optionalText(80),
    status: gradeRecordStatusSchema.optional(),
    term: optionalText(80),
  }),
});

export const createSeminaryGradeRecordSchema = z.object({
  body: seminaryGradeRecordBodySchema,
});

const encodedScoreSchema = z.object({
  studentApplicationId: z.uuid(),
  attendanceEarned: z.coerce.number().min(0),
  attendanceTotal: z.coerce.number().positive(),
  courseworkEarned: z.coerce.number().min(0),
  courseworkTotal: z.coerce.number().positive(),
  characterEarned: z.coerce.number().min(0),
  characterTotal: z.coerce.number().positive(),
  examEarned: z.coerce.number().min(0),
  examTotal: z.coerce.number().positive(),
});

export const bulkEncodeSeminaryGradesSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(1).max(200),
    entries: z.array(encodedScoreSchema).min(1).max(500),
  }),
});

export const getSeminaryGradeRecordSchema = z.object({
  params: z.object({
    id: seminaryGradeRecordIdSchema,
  }),
});

export const updateSeminaryGradeRecordSchema = z.object({
  params: z.object({
    id: seminaryGradeRecordIdSchema,
  }),
  body: seminaryGradeRecordBodySchema,
});

export const updateSeminaryGradeRecordStatusSchema = z.object({
  params: z.object({
    id: seminaryGradeRecordIdSchema,
  }),
  body: z.object({
    status: gradeRecordStatusSchema,
  }),
});

export const deleteSeminaryGradeRecordSchema = z.object({
  params: z.object({
    id: seminaryGradeRecordIdSchema,
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

export const inviteSeminaryInstructorSchema = z.object({
  params: z.object({
    id: seminaryInstructorIdSchema,
  }),
});

export const acceptSeminaryInstructorInviteSchema = z.object({
  query: z.object({
    token: z.string().trim().min(1),
  }),
  body: z
    .object({
      password: passwordSchema,
      confirmPassword: passwordSchema,
    })
    .refine((val) => val.password === val.confirmPassword, {
      message: 'Password does not match',
      path: ['confirmPassword'],
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

const gradeCriteriaWeightsSchema = z
  .object({
    attendance: z.coerce.number().min(0).max(100),
    coursework: z.coerce.number().min(0).max(100),
    character: z.coerce.number().min(0).max(100),
    exam: z.coerce.number().min(0).max(100),
  })
  .refine(
    (value) =>
      value.attendance + value.coursework + value.character + value.exam ===
      100,
    {
      message: 'criteria weights must total 100',
    },
  );

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
    criteriaWeights: gradeCriteriaWeightsSchema.optional(),
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

const seminaryAnnouncementBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(180),
    summary: optionalNullableText(2000),
    kind: z.enum(SeminaryAnnouncementKind),
    category: z.enum(SeminaryAnnouncementCategory),
    audience: z.enum(SeminaryAnnouncementAudience),
    location: optionalNullableText(255),
    allDay: z.boolean().optional().default(false),
    startsAt: z.string().datetime({ message: 'Start date and time must be a valid ISO date' }),
    endsAt: z.string().datetime({ message: 'End date and time must be a valid ISO date' }).nullable().optional(),
    status: z.enum(SeminaryAnnouncementStatus).optional().default(SeminaryAnnouncementStatus.PUBLISHED),
  })
  .refine(
    (value) => !value.endsAt || new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(),
    { message: 'End date and time must be after the start date and time', path: ['endsAt'] },
  );

export const getSeminaryAnnouncementsSchema = z.object({
  query: z.object({}),
});

export const getSeminaryDashboardSchema = z.object({
  query: z.object({
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
  }).refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, {
    message: 'startDate must be before or on endDate',
  }),
});

export const getSeminaryReportsSchema = z.object({
  query: z.object({
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
    programLevel: programLevelSchema.optional(),
    scope: z.enum(['INSTITUTIONAL', 'ACADEMIC', 'FINANCE', 'REGISTRAR']).optional(),
  }).refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, {
    message: 'startDate must be before or on endDate',
  }),
});

export const createSeminaryAnnouncementSchema = z.object({
  body: seminaryAnnouncementBodySchema,
});

export const updateSeminaryAnnouncementSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: seminaryAnnouncementBodySchema,
});

export const deleteSeminaryAnnouncementSchema = z.object({
  params: z.object({ id: z.uuid() }),
});
