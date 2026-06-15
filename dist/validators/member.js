"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceOfficerAssignmentByAdminSchema = exports.deactivateOfficerAssignmentByAdminSchema = exports.getMemberOfficerAssignmentsSchema = exports.getAllOfficerAssignmentsSchema = exports.createOfficerAssignmentByAdminSchema = exports.updateMemberByAdminSchema = exports.getPublicMemberProfileSchema = exports.getMemberByIdSchema = exports.createMemberByAdminSchema = exports.applyMemberAllowedRoles = exports.getMembershipReportSchema = exports.getAllMembersSchema = exports.updateMemberStatusSchema = exports.createCurrentMemberPublicRecordSchema = exports.createCurrentMemberCertificateSchema = exports.updateCurrentBranchServicesSchema = exports.updateCurrentEducationSchema = exports.updateCurrentChurchAffiliationSchema = exports.updateCurrentProfileBannerSchema = exports.upsertChaplaincyTrainingProgressSchema = exports.upsertMemberIdGenerationAssetSchema = exports.upsertOnlineInterviewAppointmentSchema = exports.upsertPaymentCheckoutSchema = exports.updateOnboardingStepSchema = exports.updatePreOrientationProgressSchema = exports.upsertMemberRequirementsSchema = exports.applyMemberSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
const auth_1 = require("./auth");
const ministerialExperienceSchema = zod_1.z.object({
    roleDescription: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'roleDescription is required' })
        .max(255, { message: 'roleDescription must not exceed 255 characters' }),
    yearsApprox: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'yearsApprox is required' })
        .max(100, { message: 'yearsApprox must not exceed 100 characters' }),
});
const characterReferenceSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'name is required' })
        .max(100, { message: 'name must not exceed 100 characters' }),
    positionRelationship: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'positionRelationship is required' })
        .max(255, { message: 'positionRelationship must not exceed 255 characters' }),
    contactNumber: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'contactNumber is required' })
        .max(50, { message: 'contactNumber must not exceed 50 characters' }),
});
const signatureSchema = zod_1.z.object({
    type: zod_1.z.enum(enums_1.SignatureType),
    signatureData: zod_1.z
        .string()
        .trim()
        .min(1, { message: 'signatureData is required' }),
});
exports.applyMemberSchema = zod_1.z.object({
    email: auth_1.emailSchema,
    firstName: zod_1.z.string().trim().min(1).max(100),
    middleInitial: zod_1.z.string().trim().max(1).optional(),
    lastName: zod_1.z.string().trim().min(1).max(100),
    extensionName: zod_1.z.string().trim().max(30).optional(),
    mobilePhoneNumber: zod_1.z.string().trim().min(1).max(30),
    homeAddress: zod_1.z.string().trim().min(1).max(255),
    civilStatus: zod_1.z.enum(enums_1.CivilStatus),
    gender: zod_1.z.enum(enums_1.Gender),
    nationality: zod_1.z.string().trim().min(1).max(100),
    dateOfBirth: zod_1.z.iso.datetime(),
    region: zod_1.z.string().trim().min(1).max(100),
    province: zod_1.z.string().trim().min(1).max(100),
    municipalityCity: zod_1.z.string().trim().min(1).max(100),
    barangay: zod_1.z.string().trim().min(1).max(100),
    emergencyContactName: zod_1.z.string().trim().min(1).max(100),
    emergencyContactMobile: zod_1.z.string().trim().min(1).max(30),
    churchAffiliation: zod_1.z.string().trim().max(150).optional(),
    churchAddress: zod_1.z.string().trim().max(255).optional(),
    currentPositionRole: zod_1.z.string().trim().min(1).max(150),
    currentPositionRoleOther: zod_1.z.string().trim().max(150).optional(),
    height: zod_1.z.string().trim().max(30).optional(),
    weight: zod_1.z.string().trim().max(30).optional(),
    bloodType: zod_1.z.string().trim().max(10).optional(),
    colorOfEyes: zod_1.z.string().trim().max(50).optional(),
    colorOfSkin: zod_1.z.string().trim().max(50).optional(),
    sssNumber: zod_1.z.string().trim().max(50).optional(),
    tinNumber: zod_1.z.string().trim().max(50).optional(),
    skillsTalents: zod_1.z.string().trim().max(500).optional(),
    preferredBranchIds: zod_1.z.array(zod_1.z.uuid()).max(20).optional(),
    preferredBranchOther: zod_1.z.string().trim().max(255).optional(),
    elementarySchool: zod_1.z.string().trim().max(150).optional(),
    secondarySchool: zod_1.z.string().trim().max(150).optional(),
    tertiaryCollege: zod_1.z.string().trim().max(150).optional(),
    postGraduateStudies: zod_1.z.string().trim().max(150).optional(),
    ministerialExperiences: zod_1.z.array(ministerialExperienceSchema).max(20).optional(),
    characterReferences: zod_1.z.array(characterReferenceSchema).max(20).optional(),
    signature: signatureSchema.optional(),
});
const requirementAttachmentSchema = zod_1.z.object({
    type: zod_1.z.enum(enums_1.ApplicantRequirementType),
    fileUrl: zod_1.z.url(),
    fileName: zod_1.z.string().trim().max(255).optional(),
    mimeType: zod_1.z.string().trim().max(100).optional(),
});
exports.upsertMemberRequirementsSchema = zod_1.z.object({
    attachments: zod_1.z.array(requirementAttachmentSchema).min(1).max(13),
});
exports.updatePreOrientationProgressSchema = zod_1.z.object({
    completedLessonIds: zod_1.z.array(zod_1.z.int().min(1).max(1000)).max(100),
    isCompleted: zod_1.z.boolean().optional(),
});
exports.updateOnboardingStepSchema = zod_1.z.object({
    currentStep: zod_1.z.enum(enums_1.MemberOnboardingStep),
});
exports.upsertPaymentCheckoutSchema = zod_1.z
    .object({
    paymentMethod: zod_1.z.enum(enums_1.MemberPaymentMethod),
    proofOfPaymentUrl: zod_1.z.url().optional(),
    isPromissoryNote: zod_1.z.boolean().optional(),
    promissoryNoteUrl: zod_1.z.url().optional(),
})
    .superRefine((value, ctx) => {
    var _a, _b;
    const isPromissory = value.isPromissoryNote === true;
    const hasProof = Boolean((_a = value.proofOfPaymentUrl) === null || _a === void 0 ? void 0 : _a.trim());
    const hasPromissoryFile = Boolean((_b = value.promissoryNoteUrl) === null || _b === void 0 ? void 0 : _b.trim());
    if (isPromissory && !hasPromissoryFile) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['promissoryNoteUrl'],
            message: 'Signed promissory note is required when promissory note is checked',
        });
    }
    if (value.paymentMethod !== enums_1.MemberPaymentMethod.CASH && !isPromissory && !hasProof) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['proofOfPaymentUrl'],
            message: 'Proof of payment is required for non-cash payment method',
        });
    }
});
exports.upsertOnlineInterviewAppointmentSchema = zod_1.z.object({
    interviewerId: zod_1.z.string().trim().min(1).max(100),
    interviewerName: zod_1.z.string().trim().min(1).max(150),
    day: zod_1.z.enum(enums_1.InterviewDay),
    timeSlot: zod_1.z.string().trim().min(1).max(50),
    zoomLink: zod_1.z.url(),
    meetingId: zod_1.z.string().trim().max(50).optional(),
    passcode: zod_1.z.string().trim().max(50).optional(),
});
exports.upsertMemberIdGenerationAssetSchema = zod_1.z.object({
    profileUrl: zod_1.z.url(),
    qrCodeUrl: zod_1.z.url(),
});
exports.upsertChaplaincyTrainingProgressSchema = zod_1.z.object({
    completedLessonIds: zod_1.z.array(zod_1.z.int().min(1).max(1000)).max(100),
    essayAnswers: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
    isCompleted: zod_1.z.boolean().optional(),
});
exports.updateCurrentProfileBannerSchema = zod_1.z.object({
    profileBannerUrl: zod_1.z.url().optional(),
    profileBannerPositionY: zod_1.z.int().min(0).max(100).optional(),
}).refine((value) => typeof value.profileBannerUrl === 'string' || typeof value.profileBannerPositionY === 'number', {
    message: 'profileBannerUrl or profileBannerPositionY is required',
    path: ['profileBannerUrl'],
});
exports.updateCurrentChurchAffiliationSchema = zod_1.z.object({
    churchAffiliation: zod_1.z.string().trim().max(150).optional(),
    churchAddress: zod_1.z.string().trim().max(255).optional(),
    currentPositionRole: zod_1.z.string().trim().max(150).optional(),
    currentPositionRoleOther: zod_1.z.string().trim().max(150).optional(),
});
exports.updateCurrentEducationSchema = zod_1.z.object({
    elementarySchool: zod_1.z.string().trim().max(255).optional(),
    secondarySchool: zod_1.z.string().trim().max(255).optional(),
    tertiaryCollegeEntries: zod_1.z.array(zod_1.z.string().trim().max(255)).max(20).optional(),
    postGraduateStudiesEntries: zod_1.z
        .array(zod_1.z.string().trim().max(255))
        .max(20)
        .optional(),
});
exports.updateCurrentBranchServicesSchema = zod_1.z.object({
    preferredBranchOther: zod_1.z.string().trim().max(255).optional(),
});
exports.createCurrentMemberCertificateSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1).max(150),
    certificateUrl: zod_1.z.url(),
    issuedAt: zod_1.z.iso.datetime(),
});
exports.createCurrentMemberPublicRecordSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1).max(150),
    shortDescription: zod_1.z.string().trim().min(1).max(5000),
    type: zod_1.z.enum(enums_1.MemberPublicRecordType),
    eventAt: zod_1.z.iso.datetime(),
    location: zod_1.z.string().trim().min(1).max(255),
    status: zod_1.z.enum(enums_1.MemberPublicRecordStatus),
    attachments: zod_1.z
        .array(zod_1.z.object({
        fileUrl: zod_1.z.url(),
        fileName: zod_1.z.string().trim().max(255).optional(),
        mimeType: zod_1.z.string().trim().max(100).optional(),
    }))
        .max(6)
        .optional(),
});
exports.updateMemberStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(enums_1.MemberStatus).refine((value) => value !== enums_1.MemberStatus.PENDING, {
        message: 'status must be APPROVED or REJECTED',
    }),
});
exports.getAllMembersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'page must be a positive integer',
        })
            .refine((val) => !val || parseInt(val) >= 1, {
            message: 'page must be at least 1',
        }),
        limit: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'limit must be a positive integer',
        })
            .refine((val) => !val || (parseInt(val) >= 1 && parseInt(val) <= 100), {
            message: 'limit must be between 1 and 100',
        }),
        search: zod_1.z.string().min(1).max(100).optional(),
        status: zod_1.z.enum(enums_1.MemberStatus).optional(),
        includeArchived: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || ['true', 'false'].includes(val), {
            message: 'includeArchived must be true or false',
        }),
    }),
});
exports.getMembershipReportSchema = zod_1.z.object({
    query: zod_1.z.object({
        months: zod_1.z
            .string()
            .optional()
            .refine((val) => !val || /^\d+$/.test(val), {
            message: 'months must be a positive integer',
        })
            .refine((val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= 24), {
            message: 'months must be between 1 and 24',
        }),
    }),
});
exports.applyMemberAllowedRoles = [enums_1.UserType.MEMBER];
exports.createMemberByAdminSchema = zod_1.z.object({
    email: auth_1.emailSchema,
    firstName: zod_1.z.string().trim().min(1).max(100),
    middleInitial: zod_1.z.string().trim().max(1).optional(),
    lastName: zod_1.z.string().trim().min(1).max(100),
    extensionName: zod_1.z.string().trim().max(30).optional(),
    memberType: zod_1.z.enum(enums_1.MemberType).optional(),
    badgeNumber: zod_1.z.string().trim().max(50).optional(),
    profileBannerUrl: zod_1.z.url().optional(),
    profileBannerPositionY: zod_1.z.int().min(0).max(100).optional(),
    mobilePhoneNumber: zod_1.z.string().trim().max(30).optional(),
    homeAddress: zod_1.z.string().trim().max(255).optional(),
    civilStatus: zod_1.z.enum(enums_1.CivilStatus).optional(),
    gender: zod_1.z.enum(enums_1.Gender),
    nationality: zod_1.z.string().trim().max(100).optional(),
    dateOfBirth: zod_1.z.iso.datetime(),
    createdAt: zod_1.z.iso.datetime().optional(),
    region: zod_1.z.string().trim().max(100).optional(),
    province: zod_1.z.string().trim().max(100).optional(),
    municipalityCity: zod_1.z.string().trim().max(100).optional(),
    barangay: zod_1.z.string().trim().max(100).optional(),
    emergencyContactName: zod_1.z.string().trim().max(100).optional(),
    emergencyContactMobile: zod_1.z.string().trim().max(30).optional(),
    churchAffiliation: zod_1.z.string().trim().max(150).optional(),
    churchAddress: zod_1.z.string().trim().max(255).optional(),
    currentPositionRole: zod_1.z.string().trim().max(150).optional(),
    currentPositionRoleOther: zod_1.z.string().trim().max(150).optional(),
    height: zod_1.z.string().trim().max(30).optional(),
    weight: zod_1.z.string().trim().max(30).optional(),
    bloodType: zod_1.z.string().trim().max(10).optional(),
    colorOfEyes: zod_1.z.string().trim().max(50).optional(),
    colorOfSkin: zod_1.z.string().trim().max(50).optional(),
    sssNumber: zod_1.z.string().trim().max(50).optional(),
    tinNumber: zod_1.z.string().trim().max(50).optional(),
    skillsTalents: zod_1.z.string().trim().max(500).optional(),
    preferredBranchIds: zod_1.z.array(zod_1.z.uuid()).max(20).optional(),
    preferredBranchOther: zod_1.z.string().trim().max(255).optional(),
    elementarySchool: zod_1.z.string().trim().max(150).optional(),
    secondarySchool: zod_1.z.string().trim().max(150).optional(),
    tertiaryCollege: zod_1.z.string().trim().max(150).optional(),
    postGraduateStudies: zod_1.z.string().trim().max(150).optional(),
    ministerialExperiences: zod_1.z.array(ministerialExperienceSchema).max(20).optional(),
    characterReferences: zod_1.z.array(characterReferenceSchema).max(20).optional(),
    signature: signatureSchema.optional(),
});
exports.getMemberByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
    }),
});
exports.getPublicMemberProfileSchema = zod_1.z.object({
    params: zod_1.z.object({
        memberId: zod_1.z.string().trim().min(3).max(50),
    }),
});
exports.updateMemberByAdminSchema = zod_1.z.object({
    email: auth_1.emailSchema,
    firstName: zod_1.z.string().trim().min(1).max(100),
    middleInitial: zod_1.z.string().trim().max(1).optional(),
    lastName: zod_1.z.string().trim().min(1).max(100),
    extensionName: zod_1.z.string().trim().max(30).optional(),
    memberType: zod_1.z.enum(enums_1.MemberType).optional(),
    badgeNumber: zod_1.z.string().trim().max(50).optional(),
    profileBannerUrl: zod_1.z.url().optional(),
    profileBannerPositionY: zod_1.z.int().min(0).max(100).optional(),
    mobilePhoneNumber: zod_1.z.string().trim().max(30).optional(),
    homeAddress: zod_1.z.string().trim().max(255).optional(),
    civilStatus: zod_1.z.enum(enums_1.CivilStatus).optional(),
    gender: zod_1.z.enum(enums_1.Gender),
    nationality: zod_1.z.string().trim().max(100).optional(),
    dateOfBirth: zod_1.z.iso.datetime(),
    region: zod_1.z.string().trim().max(100).optional(),
    province: zod_1.z.string().trim().max(100).optional(),
    municipalityCity: zod_1.z.string().trim().max(100).optional(),
    barangay: zod_1.z.string().trim().max(100).optional(),
    emergencyContactName: zod_1.z.string().trim().max(100).optional(),
    emergencyContactMobile: zod_1.z.string().trim().max(30).optional(),
    churchAffiliation: zod_1.z.string().trim().max(150).optional(),
    churchAddress: zod_1.z.string().trim().max(255).optional(),
    currentPositionRole: zod_1.z.string().trim().max(150).optional(),
    currentPositionRoleOther: zod_1.z.string().trim().max(150).optional(),
    height: zod_1.z.string().trim().max(30).optional(),
    weight: zod_1.z.string().trim().max(30).optional(),
    bloodType: zod_1.z.string().trim().max(10).optional(),
    colorOfEyes: zod_1.z.string().trim().max(50).optional(),
    colorOfSkin: zod_1.z.string().trim().max(50).optional(),
    sssNumber: zod_1.z.string().trim().max(50).optional(),
    tinNumber: zod_1.z.string().trim().max(50).optional(),
    skillsTalents: zod_1.z.string().trim().max(500).optional(),
    preferredBranchIds: zod_1.z.array(zod_1.z.uuid()).max(20).optional(),
    preferredBranchOther: zod_1.z.string().trim().max(255).optional(),
    elementarySchool: zod_1.z.string().trim().max(150).optional(),
    secondarySchool: zod_1.z.string().trim().max(150).optional(),
    tertiaryCollege: zod_1.z.string().trim().max(150).optional(),
    postGraduateStudies: zod_1.z.string().trim().max(150).optional(),
    ministerialExperiences: zod_1.z.array(ministerialExperienceSchema).max(20).optional(),
    characterReferences: zod_1.z.array(characterReferenceSchema).max(20).optional(),
    signature: signatureSchema.optional(),
});
exports.createOfficerAssignmentByAdminSchema = zod_1.z.object({
    officeTitleId: zod_1.z.uuid(),
    department: zod_1.z.string().trim().max(150).optional(),
    region: zod_1.z.string().trim().max(100).optional(),
    province: zod_1.z.string().trim().max(100).optional(),
    cityMunicipality: zod_1.z.string().trim().max(150).optional(),
    barangay: zod_1.z.string().trim().max(150).optional(),
    startDate: zod_1.z.iso.datetime().optional(),
});
exports.getAllOfficerAssignmentsSchema = zod_1.z.object({
    query: zod_1.z.object({
        activeOnly: zod_1.z
            .enum(["true", "false"])
            .optional()
            .transform((value) => value === "true"),
    }),
});
exports.getMemberOfficerAssignmentsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
    }),
});
exports.deactivateOfficerAssignmentByAdminSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
        assignmentId: zod_1.z.uuid(),
    }),
});
exports.replaceOfficerAssignmentByAdminSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.uuid(),
        assignmentId: zod_1.z.uuid(),
    }),
    body: zod_1.z.object({
        replacementMemberId: zod_1.z.uuid(),
        startDate: zod_1.z.iso.datetime().optional(),
    }),
});
