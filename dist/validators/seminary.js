"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySeminaryCredentialDocumentSchema = exports.getSeminaryCredentialDocumentByNumberSchema = exports.getSeminaryCredentialDocumentsSchema = exports.generateSeminaryCredentialDocumentSchema = exports.bulkDeleteSeminaryStudentsSchema = exports.bulkImportSeminaryStudentsSchema = exports.updateSeminaryFeeCollectionPaymentSchema = exports.updateSeminaryFeeCollectionStatusSchema = exports.getAllSeminaryFeeCollectionsSchema = exports.updateSeminaryFeeConfigurationSchema = exports.updateSeminaryGradeConfigurationSchema = exports.deleteSeminaryInstructorSchema = exports.updateSeminaryInstructorStatusSchema = exports.updateSeminaryInstructorSchema = exports.createSeminaryInstructorSchema = exports.getSeminaryInstructorByIdSchema = exports.getAllSeminaryInstructorsSchema = exports.deleteSeminaryAcademicYearSchema = exports.updateSeminaryAcademicYearStatusSchema = exports.updateSeminaryAcademicYearSessionSchema = exports.updateSeminaryAcademicYearSchema = exports.createSeminaryAcademicYearSchema = exports.getAllSeminaryAcademicYearsSchema = exports.deleteSeminaryCourseSchema = exports.updateSeminaryCourseStatusSchema = exports.updateSeminaryCourseSchema = exports.createSeminaryCourseSchema = exports.getAllSeminaryCoursesSchema = exports.getAllSeminaryStudentsSchema = exports.deleteSeminaryStudentSchema = exports.getSeminaryStudentByIdSchema = exports.updateSeminaryStudentSchema = exports.createSeminaryStudentSchema = exports.updateSeminaryApplicationStatusSchema = exports.getAllSeminaryApplicationsSchema = exports.getSeminaryApplicationByIdSchema = exports.createSeminaryApplicationSchema = exports.upsertCurrentSeminaryApplicationSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const optionalText = (max = 255) => zod_1.z.string().trim().max(max).optional();
const seminaryStudentIdSchema = zod_1.z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(/^[A-Za-z0-9-]+$/, {
    message: 'studentId may only contain letters, numbers, and hyphens',
});
const optionalUrl = zod_1.z.preprocess((value) => {
    if (typeof value !== 'string')
        return value;
    const normalized = value.trim();
    return normalized ? normalized : undefined;
}, zod_1.z.url().optional());
const normalizeEnumValue = (enumObject, labels) => zod_1.z.preprocess((value) => {
    var _a;
    if (typeof value !== 'string')
        return value;
    const normalized = value.trim();
    return (_a = labels[normalized]) !== null && _a !== void 0 ? _a : normalized;
}, zod_1.z.enum(enumObject));
const programLevelSchema = normalizeEnumValue(enums_1.SeminaryProgramLevel, {
    Certificate: enums_1.SeminaryProgramLevel.CERTIFICATE,
    Bachelor: enums_1.SeminaryProgramLevel.BACHELOR,
    Masteral: enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS,
    'Master with Thesis': enums_1.SeminaryProgramLevel.MASTER_WITH_THESIS,
    Doctorate: enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
    'Doctorate with Dissertation': enums_1.SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION,
});
const studentStatusSchema = normalizeEnumValue(enums_1.SeminaryStudentStatus, {
    Active: enums_1.SeminaryStudentStatus.ACTIVE,
    Graduating: enums_1.SeminaryStudentStatus.GRADUATING,
    'Leave of Absence': enums_1.SeminaryStudentStatus.LEAVE_OF_ABSENCE,
    Inactive: enums_1.SeminaryStudentStatus.INACTIVE,
});
const enrollmentTypeSchema = normalizeEnumValue(enums_1.SeminaryEnrollmentType, {
    Regular: enums_1.SeminaryEnrollmentType.REGULAR,
    Transferee: enums_1.SeminaryEnrollmentType.TRANSFEREE,
    'Cross Enrollee': enums_1.SeminaryEnrollmentType.CROSS_ENROLLEE,
});
const schoolAffiliationSchema = normalizeEnumValue(enums_1.SeminarySchoolAffiliation, {
    'In-House': enums_1.SeminarySchoolAffiliation.IN_HOUSE,
    'In House': enums_1.SeminarySchoolAffiliation.IN_HOUSE,
    'Partner School': enums_1.SeminarySchoolAffiliation.PARTNER_SCHOOL,
});
const credentialDocumentTypeSchema = normalizeEnumValue(enums_1.SeminaryCredentialDocumentType, {
    Diploma: enums_1.SeminaryCredentialDocumentType.DIPLOMA,
    Certificate: enums_1.SeminaryCredentialDocumentType.CERTIFICATE,
    Transcript: enums_1.SeminaryCredentialDocumentType.TRANSCRIPT,
});
const courseModalitySchema = normalizeEnumValue(enums_1.SeminaryCourseModality, {
    'Face to Face': enums_1.SeminaryCourseModality.FACE_TO_FACE,
    Online: enums_1.SeminaryCourseModality.ONLINE,
    Both: enums_1.SeminaryCourseModality.BOTH,
});
const courseStatusSchema = normalizeEnumValue(enums_1.SeminaryCourseStatus, {
    Active: enums_1.SeminaryCourseStatus.ACTIVE,
    Inactive: enums_1.SeminaryCourseStatus.INACTIVE,
});
const academicYearSessionSchema = normalizeEnumValue(enums_1.SeminaryAcademicYearSession, {
    Current: enums_1.SeminaryAcademicYearSession.CURRENT,
    Previous: enums_1.SeminaryAcademicYearSession.PREVIOUS,
    Upcoming: enums_1.SeminaryAcademicYearSession.UPCOMING,
});
const academicYearStatusSchema = normalizeEnumValue(enums_1.SeminaryAcademicYearStatus, {
    Active: enums_1.SeminaryAcademicYearStatus.ACTIVE,
    Upcoming: enums_1.SeminaryAcademicYearStatus.UPCOMING,
    Completed: enums_1.SeminaryAcademicYearStatus.COMPLETED,
});
const instructorStatusSchema = normalizeEnumValue(enums_1.SeminaryInstructorStatus, {
    Active: enums_1.SeminaryInstructorStatus.ACTIVE,
    'Part-time': enums_1.SeminaryInstructorStatus.PART_TIME,
    'Part Time': enums_1.SeminaryInstructorStatus.PART_TIME,
    'On Leave': enums_1.SeminaryInstructorStatus.ON_LEAVE,
    Inactive: enums_1.SeminaryInstructorStatus.INACTIVE,
});
const instructorRankSchema = normalizeEnumValue(enums_1.SeminaryInstructorRank, {
    'Adjunct Instructor': enums_1.SeminaryInstructorRank.ADJUNCT_INSTRUCTOR,
    Lecturer: enums_1.SeminaryInstructorRank.LECTURER,
    'Assistant Professor': enums_1.SeminaryInstructorRank.ASSISTANT_PROFESSOR,
    'Associate Professor': enums_1.SeminaryInstructorRank.ASSOCIATE_PROFESSOR,
    Professor: enums_1.SeminaryInstructorRank.PROFESSOR,
});
const paymentTypeSchema = normalizeEnumValue(enums_1.SeminaryPaymentType, {
    'Full Payment': enums_1.SeminaryPaymentType.FULL_PAYMENT,
    'Partial Payment': enums_1.SeminaryPaymentType.PARTIAL_PAYMENT,
});
const paymentMethodSchema = normalizeEnumValue(enums_1.SeminaryPaymentMethod, {
    'Bank Deposit / Bank Transfer': enums_1.SeminaryPaymentMethod.BANK_TRANSFER,
    'Bank Transfer': enums_1.SeminaryPaymentMethod.BANK_TRANSFER,
    GCash: enums_1.SeminaryPaymentMethod.GCASH,
    Maya: enums_1.SeminaryPaymentMethod.MAYA,
});
const feeCollectionStatusSchema = normalizeEnumValue(enums_1.SeminaryFeeCollectionStatus, {
    Pending: enums_1.SeminaryFeeCollectionStatus.PENDING,
    'Partially Paid': enums_1.SeminaryFeeCollectionStatus.PARTIALLY_PAID,
    Paid: enums_1.SeminaryFeeCollectionStatus.PAID,
    Overdue: enums_1.SeminaryFeeCollectionStatus.OVERDUE,
});
const genderSchema = normalizeEnumValue(enums_1.Gender, {
    Male: enums_1.Gender.MALE,
    male: enums_1.Gender.MALE,
    Female: enums_1.Gender.FEMALE,
    female: enums_1.Gender.FEMALE,
    'Prefer not to say': enums_1.Gender.PREFER_NOT_TO_SAY,
});
const civilStatusSchema = normalizeEnumValue(enums_1.CivilStatus, {
    Single: enums_1.CivilStatus.SINGLE,
    single: enums_1.CivilStatus.SINGLE,
    Married: enums_1.CivilStatus.MARRIED,
    married: enums_1.CivilStatus.MARRIED,
    Widowed: enums_1.CivilStatus.WIDOWED,
    widowed: enums_1.CivilStatus.WIDOWED,
    Separated: enums_1.CivilStatus.SEPARATED,
    separated: enums_1.CivilStatus.SEPARATED,
    Annulled: enums_1.CivilStatus.ANNULLED,
    annulled: enums_1.CivilStatus.ANNULLED,
});
const dateStringSchema = zod_1.z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: 'dateOfBirth must be a valid date',
});
const fileMetadataSchema = zod_1.z.object({
    fileUrl: optionalUrl,
    fileName: optionalText(),
    mimeType: optionalText(100),
    fileSize: optionalText(50),
});
exports.upsertCurrentSeminaryApplicationSchema = zod_1.z.object({
    personalInformation: zod_1.z.object({
        academicYear: optionalText(50),
        surname: optionalText(100),
        givenName: optionalText(100),
        middleName: optionalText(100),
        emailAddress: zod_1.z.email().optional().or(zod_1.z.literal('')),
        mobilePhone: optionalText(30),
        homeAddress: optionalText(255),
        dateOfBirth: dateStringSchema,
        birthPlace: optionalText(150),
        age: zod_1.z.string().trim().optional().or(zod_1.z.number().optional()),
        gender: genderSchema.optional().or(zod_1.z.literal('')),
        height: optionalText(30),
        weight: optionalText(30),
        civilStatus: civilStatusSchema.optional().or(zod_1.z.literal('')),
        officePhone: optionalText(30),
    }),
    ministry: zod_1.z.object({
        churchAttended: optionalText(150),
        churchAddress: optionalText(255),
        pastorName: optionalText(150),
        contactNumber: optionalText(30),
        ministryInvolved: optionalText(255),
    }),
    curriculum: zod_1.z.object({
        programLevel: programLevelSchema.optional().or(zod_1.z.literal('')),
        programCourse: optionalText(150),
    }),
    educationalBackground: zod_1.z.object({
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
    requirements: zod_1.z.object({
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
    payment: zod_1.z.object({
        type: paymentTypeSchema,
        method: paymentMethodSchema,
        amountPaid: zod_1.z.coerce.number().positive(),
        totalAmountDue: zod_1.z
            .union([zod_1.z.coerce.number().positive(), zod_1.z.string().trim()])
            .optional(),
        proofOfReceipt: fileMetadataSchema.optional(),
        proofOfReceiptUrl: optionalUrl,
        proofOfReceiptFileName: optionalText(),
        proofOfReceiptMimeType: optionalText(100),
        proofOfReceiptFileSize: optionalText(50),
    }),
});
exports.createSeminaryApplicationSchema = zod_1.z.object({
    body: zod_1.z.object({
        admissionDate: dateStringSchema,
        academicYear: optionalText(50),
        surname: optionalText(100),
        givenName: optionalText(100),
        middleName: optionalText(100),
        emailAddress: zod_1.z.email().optional().or(zod_1.z.literal('')),
        mobilePhone: optionalText(30),
        mailingAddress: optionalText(255),
        homeAddress: optionalText(255),
        dateOfBirth: dateStringSchema,
        birthPlace: optionalText(150),
        age: zod_1.z.string().trim().optional().or(zod_1.z.number().optional()),
        gender: genderSchema.optional().or(zod_1.z.literal('')),
        height: optionalText(30),
        weight: optionalText(30),
        civilStatus: civilStatusSchema.optional().or(zod_1.z.literal('')),
        officePhone: optionalText(30),
        churchAttended: optionalText(150),
        churchAddress: optionalText(255),
        pastorName: optionalText(150),
        contactNumber: optionalText(30),
        ministryInvolved: optionalText(255),
        programLevel: programLevelSchema.optional().or(zod_1.z.literal('')),
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
exports.getSeminaryApplicationByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
    }),
});
exports.getAllSeminaryApplicationsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .refine((value) => !value || /^\d+$/.test(value), {
            message: 'page must be a positive integer',
        }),
        limit: zod_1.z
            .string()
            .optional()
            .refine((value) => !value || /^\d+$/.test(value), {
            message: 'limit must be a positive integer',
        }),
        status: zod_1.z.enum(enums_1.SeminaryApplicationStatus).optional(),
        search: optionalText(100),
    }),
});
exports.updateSeminaryApplicationStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
    }),
    body: zod_1.z
        .object({
        status: zod_1.z
            .enum(enums_1.SeminaryApplicationStatus)
            .refine((value) => value === enums_1.SeminaryApplicationStatus.UNDER_REVIEW ||
            value === enums_1.SeminaryApplicationStatus.APPROVED ||
            value === enums_1.SeminaryApplicationStatus.ENROLLED ||
            value === enums_1.SeminaryApplicationStatus.REJECTED ||
            value === enums_1.SeminaryApplicationStatus.CANCELLED, {
            message: 'status must be UNDER_REVIEW, APPROVED, ENROLLED, REJECTED, or CANCELLED',
        }),
        reviewRemarks: optionalText(1000),
    })
        .refine((body) => {
        var _a;
        return body.status !== enums_1.SeminaryApplicationStatus.REJECTED ||
            Boolean((_a = body.reviewRemarks) === null || _a === void 0 ? void 0 : _a.trim());
    }, {
        message: 'A rejection reason is required when rejecting an application',
        path: ['reviewRemarks'],
    }),
});
const seminaryStudentBodySchema = zod_1.z.object({
    studentId: zod_1.z
        .preprocess((value) => (typeof value === 'string' ? value.toUpperCase() : value), seminaryStudentIdSchema)
        .optional()
        .or(zod_1.z.literal('')),
    academicYear: optionalText(50),
    surname: optionalText(100),
    givenName: optionalText(100),
    middleName: optionalText(100),
    emailAddress: zod_1.z.email().optional().or(zod_1.z.literal('')),
    mobilePhone: optionalText(30),
    homeAddress: optionalText(255),
    birthPlace: optionalText(150),
    gender: genderSchema.optional().or(zod_1.z.literal('')),
    civilStatus: civilStatusSchema.optional().or(zod_1.z.literal('')),
    churchAttended: optionalText(150),
    churchAddress: optionalText(255),
    pastorName: optionalText(150),
    contactNumber: optionalText(30),
    ministryInvolved: optionalText(255),
    programLevel: programLevelSchema.optional().or(zod_1.z.literal('')),
    programCourse: optionalText(150),
    enrollmentType: enrollmentTypeSchema.optional().or(zod_1.z.literal('')),
    schoolAffiliation: schoolAffiliationSchema.optional().or(zod_1.z.literal('')),
    yearLevel: optionalText(100),
    studentStatus: studentStatusSchema.optional().or(zod_1.z.literal('')),
});
exports.createSeminaryStudentSchema = zod_1.z.object({
    body: seminaryStudentBodySchema,
});
exports.updateSeminaryStudentSchema = zod_1.z.object({
    params: zod_1.z.object({
        studentId: seminaryStudentIdSchema,
    }),
    body: seminaryStudentBodySchema,
});
exports.getSeminaryStudentByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        studentId: seminaryStudentIdSchema,
    }),
});
exports.deleteSeminaryStudentSchema = zod_1.z.object({
    params: zod_1.z.object({
        studentId: seminaryStudentIdSchema,
    }),
});
exports.getAllSeminaryStudentsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .refine((value) => !value || /^\d+$/.test(value), {
            message: 'page must be a positive integer',
        }),
        limit: zod_1.z
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
const seminaryCourseIdSchema = zod_1.z.uuid();
const seminaryCourseBodySchema = zod_1.z.object({
    courseName: zod_1.z.string().trim().min(1).max(200),
    courseCode: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(40)
        .transform((value) => value.toUpperCase()),
    program: programLevelSchema,
    units: zod_1.z.coerce.number().int().min(1).max(12),
    modality: courseModalitySchema,
    status: courseStatusSchema.optional(),
    sortOrder: zod_1.z.coerce.number().int().min(0).optional(),
});
exports.getAllSeminaryCoursesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .refine((value) => !value || /^\d+$/.test(value), {
            message: 'page must be a positive integer',
        }),
        limit: zod_1.z
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
exports.createSeminaryCourseSchema = zod_1.z.object({
    body: seminaryCourseBodySchema,
});
exports.updateSeminaryCourseSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryCourseIdSchema,
    }),
    body: seminaryCourseBodySchema,
});
exports.updateSeminaryCourseStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryCourseIdSchema,
    }),
    body: zod_1.z.object({
        status: courseStatusSchema,
    }),
});
exports.deleteSeminaryCourseSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryCourseIdSchema,
    }),
});
const seminaryAcademicYearIdSchema = zod_1.z.uuid();
const academicYearDateSchema = zod_1.z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'date must be a valid date',
});
const seminaryAcademicYearBodySchema = zod_1.z
    .object({
    academicYear: zod_1.z
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
    sortOrder: zod_1.z.coerce.number().int().min(0).optional(),
})
    .refine((body) => new Date(body.endDate) >= new Date(body.startDate), {
    message: 'endDate must be after startDate',
    path: ['endDate'],
});
exports.getAllSeminaryAcademicYearsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .refine((value) => !value || /^\d+$/.test(value), {
            message: 'page must be a positive integer',
        }),
        limit: zod_1.z
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
exports.createSeminaryAcademicYearSchema = zod_1.z.object({
    body: seminaryAcademicYearBodySchema,
});
exports.updateSeminaryAcademicYearSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryAcademicYearIdSchema,
    }),
    body: seminaryAcademicYearBodySchema,
});
exports.updateSeminaryAcademicYearSessionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryAcademicYearIdSchema,
    }),
    body: zod_1.z.object({
        session: academicYearSessionSchema,
    }),
});
exports.updateSeminaryAcademicYearStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryAcademicYearIdSchema,
    }),
    body: zod_1.z.object({
        status: academicYearStatusSchema,
    }),
});
exports.deleteSeminaryAcademicYearSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryAcademicYearIdSchema,
    }),
});
const seminaryInstructorIdSchema = zod_1.z.uuid();
const scoreSchema = zod_1.z.coerce.number().min(0).max(100);
const listTextSchema = zod_1.z
    .array(zod_1.z.string().trim().min(1).max(255))
    .min(1)
    .max(50);
const seminaryInstructorBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(150),
    professionalTitle: zod_1.z.string().trim().min(1).max(150),
    email: zod_1.z.email(),
    contactNumber: zod_1.z.string().trim().min(1).max(30),
    teachingPrograms: zod_1.z.array(programLevelSchema).min(1).max(4),
    rank: instructorRankSchema,
    status: instructorStatusSchema.optional(),
    loadUnits: zod_1.z.coerce.number().int().min(0).max(60),
    biography: zod_1.z.string().trim().min(1).max(5000),
    educationalBackground: zod_1.z.string().trim().min(1).max(5000),
    areasOfExpertise: listTextSchema,
    credentials: listTextSchema,
    formalPhotoUrl: zod_1.z.string().trim().min(1).max(5000000),
    isFilipinoCitizen: zod_1.z.boolean(),
    highSchoolGraduateOrEquivalent: zod_1.z.boolean(),
    ministerialExperienceYears: zod_1.z.coerce.number().int().min(5).max(80),
    submissionDeadline: academicYearDateSchema.optional(),
    evaluation: zod_1.z.object({
        attendanceParticipation: scoreSchema,
        leadershipCharacter: scoreSchema,
        ministryCommunityEngagement: scoreSchema,
        knowledgeSkillsAssessment: scoreSchema,
        professionalConductEthics: scoreSchema,
    }),
});
exports.getAllSeminaryInstructorsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .refine((value) => !value || /^\d+$/.test(value), {
            message: 'page must be a positive integer',
        }),
        limit: zod_1.z
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
exports.getSeminaryInstructorByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryInstructorIdSchema,
    }),
});
exports.createSeminaryInstructorSchema = zod_1.z.object({
    body: seminaryInstructorBodySchema,
});
exports.updateSeminaryInstructorSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryInstructorIdSchema,
    }),
    body: seminaryInstructorBodySchema,
});
exports.updateSeminaryInstructorStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryInstructorIdSchema,
    }),
    body: zod_1.z.object({
        status: instructorStatusSchema,
    }),
});
exports.deleteSeminaryInstructorSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: seminaryInstructorIdSchema,
    }),
});
const gradeScaleRowSchema = zod_1.z.object({
    equivalent: zod_1.z.string().trim().min(1).max(20),
    percentageRange: zod_1.z.string().trim().min(1).max(50),
    remarks: zod_1.z.string().trim().min(1).max(100),
});
exports.updateSeminaryGradeConfigurationSchema = zod_1.z.object({
    body: zod_1.z.object({
        passingEquivalent: zod_1.z.string().trim().min(1).max(20).optional(),
        releaseWindow: zod_1.z.string().trim().min(1).max(100).optional(),
        weightProfile: zod_1.z.string().trim().min(1).max(100).optional(),
        completionWindowDays: zod_1.z.coerce.number().int().min(1).max(365).optional(),
        approvalWorkflow: zod_1.z.boolean().optional(),
        allowFacultyOverride: zod_1.z.boolean().optional(),
        autoPublishApproved: zod_1.z.boolean().optional(),
        showConditionalRemark: zod_1.z.boolean().optional(),
        gradeScale: zod_1.z.array(gradeScaleRowSchema).min(1).max(50).optional(),
    }),
});
const feeBreakdownItemSchema = zod_1.z.object({
    label: zod_1.z.string().trim().min(1).max(120),
    amount: zod_1.z.coerce.number().min(0).max(1000000),
});
exports.updateSeminaryFeeConfigurationSchema = zod_1.z.object({
    body: zod_1.z.object({
        feeBreakdowns: zod_1.z.object({
            Certificate: zod_1.z.array(feeBreakdownItemSchema).min(1).max(50),
            Bachelor: zod_1.z.array(feeBreakdownItemSchema).min(1).max(50),
            Masteral: zod_1.z.array(feeBreakdownItemSchema).min(1).max(50),
            Doctorate: zod_1.z.array(feeBreakdownItemSchema).min(1).max(50),
        }),
    }),
});
exports.getAllSeminaryFeeCollectionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .refine((value) => !value || /^\d+$/.test(value), {
            message: 'page must be a positive integer',
        }),
        limit: zod_1.z
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
exports.updateSeminaryFeeCollectionStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
    }),
    body: zod_1.z.object({
        status: feeCollectionStatusSchema,
    }),
});
exports.updateSeminaryFeeCollectionPaymentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
    }),
    body: zod_1.z.object({
        amountPaid: zod_1.z.coerce.number().min(0).max(1000000),
        dueDate: academicYearDateSchema.optional(),
        paymentMethod: zod_1.z.string().trim().min(1).max(80),
        status: feeCollectionStatusSchema.optional(),
    }),
});
exports.bulkImportSeminaryStudentsSchema = zod_1.z.object({
    body: zod_1.z.object({
        students: zod_1.z.array(seminaryStudentBodySchema).min(1).max(1000),
    }),
});
exports.bulkDeleteSeminaryStudentsSchema = zod_1.z.object({
    body: zod_1.z.object({
        studentIds: zod_1.z
            .array(seminaryStudentIdSchema)
            .min(1)
            .max(1000),
    }),
});
exports.generateSeminaryCredentialDocumentSchema = zod_1.z.object({
    params: zod_1.z.object({
        studentId: seminaryStudentIdSchema,
    }),
    body: zod_1.z.object({
        type: credentialDocumentTypeSchema,
        title: optionalText(150),
        remarks: optionalText(1000),
    }),
});
exports.getSeminaryCredentialDocumentsSchema = zod_1.z.object({
    params: zod_1.z.object({
        studentId: seminaryStudentIdSchema,
    }),
    query: zod_1.z.object({
        type: credentialDocumentTypeSchema.optional(),
    }),
});
exports.getSeminaryCredentialDocumentByNumberSchema = zod_1.z.object({
    params: zod_1.z.object({
        documentNumber: zod_1.z.string().trim().min(3).max(50),
    }),
});
exports.verifySeminaryCredentialDocumentSchema = zod_1.z.object({
    params: zod_1.z.object({
        token: zod_1.z.string().trim().min(16).max(128),
    }),
});
