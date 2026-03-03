"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyMemberAllowedRoles = exports.getAllMembersSchema = exports.updateMemberStatusSchema = exports.applyMemberSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
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
    firstName: zod_1.z.string().trim().min(1).max(100),
    lastName: zod_1.z.string().trim().min(1).max(100),
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
    recentIdPhotoUrl: zod_1.z.url().nullable().optional(),
    churchAffiliation: zod_1.z.string().trim().min(1).max(150),
    churchAddress: zod_1.z.string().trim().min(1).max(255),
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
exports.applyMemberAllowedRoles = [enums_1.UserType.MEMBER];
