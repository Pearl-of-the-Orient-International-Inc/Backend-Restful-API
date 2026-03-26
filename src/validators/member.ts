import { z } from 'zod';
import {
  ApplicantRequirementType,
  CivilStatus,
  Gender,
  InterviewDay,
  MemberOnboardingStep,
  MemberPaymentMethod,
  MemberStatus,
  MemberType,
  SignatureType,
  UserType,
} from '@/generated/prisma/enums';
import { emailSchema } from './auth';

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
  middleInitial: z.string().trim().max(1).optional(),
  email: emailSchema.optional(),
  lastName: z.string().trim().min(1).max(100),
  extensionName: z.string().trim().max(30).optional(),
  mobilePhoneNumber: z.string().trim().max(30).optional(),
  homeAddress: z.string().trim().max(255).optional(),
  civilStatus: z.enum(CivilStatus).optional(),
  gender: z.enum(Gender),
  nationality: z.string().trim().max(100).optional(),
  dateOfBirth: z.iso.datetime(),
  region: z.string().trim().max(100).optional(),
  province: z.string().trim().max(100).optional(),
  municipalityCity: z.string().trim().max(100).optional(),
  barangay: z.string().trim().max(100).optional(),
  emergencyContactName: z.string().trim().max(100).optional(),
  emergencyContactMobile: z.string().trim().max(30).optional(),
  churchAffiliation: z.string().trim().max(150).optional(),
  churchAddress: z.string().trim().max(255).optional(),
  currentPositionRole: z.string().trim().max(150).optional(),
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

const requirementAttachmentSchema = z.object({
  type: z.enum(ApplicantRequirementType),
  fileUrl: z.url(),
  fileName: z.string().trim().max(255).optional(),
  mimeType: z.string().trim().max(100).optional(),
});

export const upsertMemberRequirementsSchema = z.object({
  attachments: z.array(requirementAttachmentSchema).min(1).max(13),
});

export const updatePreOrientationProgressSchema = z.object({
  completedLessonIds: z.array(z.int().min(1).max(1000)).max(100),
  isCompleted: z.boolean().optional(),
});

export const updateOnboardingStepSchema = z.object({
  currentStep: z.enum(MemberOnboardingStep),
});

export const upsertPaymentCheckoutSchema = z
  .object({
    paymentMethod: z.enum(MemberPaymentMethod),
    proofOfPaymentUrl: z.url().optional(),
    isPromissoryNote: z.boolean().optional(),
    promissoryNoteUrl: z.url().optional(),
  })
  .superRefine((value, ctx) => {
    const isPromissory = value.isPromissoryNote === true;
    const hasProof = Boolean(value.proofOfPaymentUrl?.trim());
    const hasPromissoryFile = Boolean(value.promissoryNoteUrl?.trim());

    if (isPromissory && !hasPromissoryFile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['promissoryNoteUrl'],
        message: 'Signed promissory note is required when promissory note is checked',
      });
    }

    if (value.paymentMethod !== MemberPaymentMethod.CASH && !isPromissory && !hasProof) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['proofOfPaymentUrl'],
        message: 'Proof of payment is required for non-cash payment method',
      });
    }
  });

export const upsertOnlineInterviewAppointmentSchema = z.object({
  interviewerId: z.string().trim().min(1).max(100),
  interviewerName: z.string().trim().min(1).max(150),
  day: z.enum(InterviewDay),
  timeSlot: z.string().trim().min(1).max(50),
  zoomLink: z.url(),
  meetingId: z.string().trim().max(50).optional(),
  passcode: z.string().trim().max(50).optional(),
});

export const upsertMemberIdGenerationAssetSchema = z.object({
  profileUrl: z.url(),
  qrCodeUrl: z.url(),
  certificateUrl: z.url(),
});

export const upsertChaplaincyTrainingProgressSchema = z.object({
  completedLessonIds: z.array(z.int().min(1).max(1000)).max(100),
  essayAnswers: z.record(z.string(), z.string()).optional(),
  isCompleted: z.boolean().optional(),
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

export const createMemberByAdminSchema = z.object({
  email: emailSchema,
  firstName: z.string().trim().min(1).max(100),
  middleInitial: z.string().trim().max(1).optional(),
  lastName: z.string().trim().min(1).max(100),
  extensionName: z.string().trim().max(30).optional(),
  memberType: z.enum(MemberType).optional(),
  badgeNumber: z.string().trim().max(50).optional(),
  mobilePhoneNumber: z.string().trim().max(30).optional(),
  homeAddress: z.string().trim().max(255).optional(),
  civilStatus: z.enum(CivilStatus).optional(),
  gender: z.enum(Gender),
  nationality: z.string().trim().max(100).optional(),
  dateOfBirth: z.iso.datetime(),
  createdAt: z.iso.datetime().optional(),
  region: z.string().trim().max(100).optional(),
  province: z.string().trim().max(100).optional(),
  municipalityCity: z.string().trim().max(100).optional(),
  barangay: z.string().trim().max(100).optional(),
  emergencyContactName: z.string().trim().max(100).optional(),
  emergencyContactMobile: z.string().trim().max(30).optional(),
  churchAffiliation: z.string().trim().max(150).optional(),
  churchAddress: z.string().trim().max(255).optional(),
  currentPositionRole: z.string().trim().max(150).optional(),
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

export type CreateMemberByAdminSchema = z.infer<typeof createMemberByAdminSchema>;

export const getMemberByIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const updateMemberByAdminSchema = z.object({
  email: emailSchema,
  firstName: z.string().trim().min(1).max(100),
  middleInitial: z.string().trim().max(1).optional(),
  lastName: z.string().trim().min(1).max(100),
  extensionName: z.string().trim().max(30).optional(),
  memberType: z.enum(MemberType).optional(),
  badgeNumber: z.string().trim().max(50).optional(),
  mobilePhoneNumber: z.string().trim().max(30).optional(),
  homeAddress: z.string().trim().max(255).optional(),
  civilStatus: z.enum(CivilStatus).optional(),
  gender: z.enum(Gender),
  nationality: z.string().trim().max(100).optional(),
  dateOfBirth: z.iso.datetime(),
  region: z.string().trim().max(100).optional(),
  province: z.string().trim().max(100).optional(),
  municipalityCity: z.string().trim().max(100).optional(),
  barangay: z.string().trim().max(100).optional(),
  emergencyContactName: z.string().trim().max(100).optional(),
  emergencyContactMobile: z.string().trim().max(30).optional(),
  churchAffiliation: z.string().trim().max(150).optional(),
  churchAddress: z.string().trim().max(255).optional(),
  currentPositionRole: z.string().trim().max(150).optional(),
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

export const createOfficerAssignmentByAdminSchema = z.object({
  officeTitleId: z.uuid(),
  department: z.string().trim().max(150).optional(),
  region: z.string().trim().max(100).optional(),
  province: z.string().trim().max(100).optional(),
  cityMunicipality: z.string().trim().max(150).optional(),
  barangay: z.string().trim().max(150).optional(),
  startDate: z.iso.datetime().optional(),
});

export type CreateOfficerAssignmentByAdminSchema = z.infer<
  typeof createOfficerAssignmentByAdminSchema
>;

export const getAllOfficerAssignmentsSchema = z.object({
  query: z.object({
    activeOnly: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
  }),
});

export const getMemberOfficerAssignmentsSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const deactivateOfficerAssignmentByAdminSchema = z.object({
  params: z.object({
    id: z.uuid(),
    assignmentId: z.uuid(),
  }),
});

export const replaceOfficerAssignmentByAdminSchema = z.object({
  params: z.object({
    id: z.uuid(),
    assignmentId: z.uuid(),
  }),
  body: z.object({
    replacementMemberId: z.uuid(),
    startDate: z.iso.datetime().optional(),
  }),
});

export type ReplaceOfficerAssignmentByAdminSchema = z.infer<
  typeof replaceOfficerAssignmentByAdminSchema
>["body"];
