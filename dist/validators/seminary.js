"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySeminaryCredentialDocumentSchema = exports.getSeminaryCredentialDocumentByNumberSchema = exports.getSeminaryCredentialDocumentsSchema = exports.generateSeminaryCredentialDocumentSchema = exports.bulkImportSeminaryStudentsSchema = exports.getAllSeminaryStudentsSchema = exports.getSeminaryStudentByIdSchema = exports.updateSeminaryStudentSchema = exports.createSeminaryStudentSchema = exports.updateSeminaryApplicationStatusSchema = exports.getAllSeminaryApplicationsSchema = exports.getSeminaryApplicationByIdSchema = exports.upsertCurrentSeminaryApplicationSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const optionalText = (max = 255) => zod_1.z.string().trim().max(max).optional();
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
const credentialDocumentTypeSchema = normalizeEnumValue(enums_1.SeminaryCredentialDocumentType, {
    Diploma: enums_1.SeminaryCredentialDocumentType.DIPLOMA,
    Certificate: enums_1.SeminaryCredentialDocumentType.CERTIFICATE,
    Transcript: enums_1.SeminaryCredentialDocumentType.TRANSCRIPT,
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
const genderSchema = normalizeEnumValue(enums_1.Gender, {
    Male: enums_1.Gender.MALE,
    Female: enums_1.Gender.FEMALE,
    'Prefer not to say': enums_1.Gender.PREFER_NOT_TO_SAY,
});
const civilStatusSchema = normalizeEnumValue(enums_1.CivilStatus, {
    Single: enums_1.CivilStatus.SINGLE,
    Married: enums_1.CivilStatus.MARRIED,
    Widowed: enums_1.CivilStatus.WIDOWED,
    Separated: enums_1.CivilStatus.SEPARATED,
    Annulled: enums_1.CivilStatus.ANNULLED,
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
        status: zod_1.z.enum(enums_1.SeminaryApplicationStatus).refine((value) => value === enums_1.SeminaryApplicationStatus.UNDER_REVIEW ||
            value === enums_1.SeminaryApplicationStatus.APPROVED ||
            value === enums_1.SeminaryApplicationStatus.REJECTED, {
            message: 'status must be UNDER_REVIEW, APPROVED, or REJECTED',
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
    studentId: zod_1.z.string().trim().regex(/^POTSC-\d{2}-\d{4}$/).optional().or(zod_1.z.literal('')),
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
    yearLevel: optionalText(100),
    studentStatus: studentStatusSchema.optional().or(zod_1.z.literal('')),
});
exports.createSeminaryStudentSchema = zod_1.z.object({
    body: seminaryStudentBodySchema,
});
exports.updateSeminaryStudentSchema = zod_1.z.object({
    params: zod_1.z.object({
        studentId: zod_1.z.string().trim().regex(/^POTSC-\d{2}-\d{4}$/),
    }),
    body: seminaryStudentBodySchema,
});
exports.getSeminaryStudentByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        studentId: zod_1.z.string().trim().regex(/^POTSC-\d{2}-\d{4}$/),
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
        academicYear: optionalText(50),
    }),
});
exports.bulkImportSeminaryStudentsSchema = zod_1.z.object({
    body: zod_1.z.object({
        students: zod_1.z.array(seminaryStudentBodySchema).min(1).max(1000),
    }),
});
exports.generateSeminaryCredentialDocumentSchema = zod_1.z.object({
    params: zod_1.z.object({
        studentId: zod_1.z.string().trim().regex(/^POTSC-\d{2}-\d{4}$/),
    }),
    body: zod_1.z.object({
        type: credentialDocumentTypeSchema,
        title: optionalText(150),
        remarks: optionalText(1000),
    }),
});
exports.getSeminaryCredentialDocumentsSchema = zod_1.z.object({
    params: zod_1.z.object({
        studentId: zod_1.z.string().trim().regex(/^POTSC-\d{2}-\d{4}$/),
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
