import { z } from 'zod';
import {
  ApplicantRequirementType,
  CivilStatus,
  Gender,
  InterviewDay,
  MemberOnboardingStep,
  MemberPaymentMethod,
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
