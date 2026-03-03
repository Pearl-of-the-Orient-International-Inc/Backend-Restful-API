import { z } from 'zod';
import {
  CivilStatus,
  Gender,
  MemberStatus,
  SignatureType,
  UserType,
} from '@/generated/prisma/enums';

const ministerialExperienceSchema = z.object({
  roleDescription: z
    .string()
    .trim()
    .min(1, { message: 'roleDescription is required' })
    .max(255, { message: 'roleDescription must not exceed 255 characters' }),
  yearsApprox: z
    .string()
    .trim()
    .min(1, { message: 'yearsApprox is required' })
    .max(100, { message: 'yearsApprox must not exceed 100 characters' }),
});

const characterReferenceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'name is required' })
    .max(100, { message: 'name must not exceed 100 characters' }),
  positionRelationship: z
    .string()
    .trim()
    .min(1, { message: 'positionRelationship is required' })
    .max(255, { message: 'positionRelationship must not exceed 255 characters' }),
  contactNumber: z
    .string()
    .trim()
    .min(1, { message: 'contactNumber is required' })
    .max(50, { message: 'contactNumber must not exceed 50 characters' }),
});

const signatureSchema = z.object({
  type: z.enum(SignatureType),
  signatureData: z
    .string()
    .trim()
    .min(1, { message: 'signatureData is required' }),
});

export const applyMemberSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  mobilePhoneNumber: z.string().trim().min(1).max(30),
  homeAddress: z.string().trim().min(1).max(255),
  civilStatus: z.enum(CivilStatus),
  gender: z.enum(Gender),
  nationality: z.string().trim().min(1).max(100),
  dateOfBirth: z.iso.datetime(),
  region: z.string().trim().min(1).max(100),
  province: z.string().trim().min(1).max(100),
  municipalityCity: z.string().trim().min(1).max(100),
  barangay: z.string().trim().min(1).max(100),
  emergencyContactName: z.string().trim().min(1).max(100),
  emergencyContactMobile: z.string().trim().min(1).max(30),
  recentIdPhotoUrl: z.url().nullable().optional(),
  churchAffiliation: z.string().trim().min(1).max(150),
  churchAddress: z.string().trim().min(1).max(255),
  currentPositionRole: z.string().trim().min(1).max(150),
  currentPositionRoleOther: z.string().trim().max(150).optional(),
  height: z.string().trim().max(30).optional(),
  weight: z.string().trim().max(30).optional(),
  bloodType: z.string().trim().max(10).optional(),
  colorOfEyes: z.string().trim().max(50).optional(),
  colorOfSkin: z.string().trim().max(50).optional(),
  sssNumber: z.string().trim().max(50).optional(),
  tinNumber: z.string().trim().max(50).optional(),
  skillsTalents: z.string().trim().max(500).optional(),
  preferredBranchIds: z.array(z.uuid()).max(20).optional(),
  preferredBranchOther: z.string().trim().max(255).optional(),
  elementarySchool: z.string().trim().max(150).optional(),
  secondarySchool: z.string().trim().max(150).optional(),
  tertiaryCollege: z.string().trim().max(150).optional(),
  postGraduateStudies: z.string().trim().max(150).optional(),
  ministerialExperiences: z.array(ministerialExperienceSchema).max(20).optional(),
  characterReferences: z.array(characterReferenceSchema).max(20).optional(),
  signature: signatureSchema.optional(),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(MemberStatus).refine((value) => value !== MemberStatus.PENDING, {
    message: 'status must be APPROVED or REJECTED',
  }),
});

export const getAllMembersSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: 'page must be a positive integer',
      })
      .refine((val) => !val || parseInt(val) >= 1, {
        message: 'page must be at least 1',
      }),
    limit: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: 'limit must be a positive integer',
      })
      .refine((val) => !val || (parseInt(val) >= 1 && parseInt(val) <= 100), {
        message: 'limit must be between 1 and 100',
      }),
    search: z.string().min(1).max(100).optional(),
    status: z.enum(MemberStatus).optional(),
    includeArchived: z
      .string()
      .optional()
      .refine((val) => !val || ['true', 'false'].includes(val), {
        message: 'includeArchived must be true or false',
      }),
  }),
});

export const applyMemberAllowedRoles = [UserType.MEMBER] as const;
