/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { applyMember } from '@/controllers/v1/member/apply-member';
import { createMemberByAdmin } from '@/controllers/v1/member/create-member-by-admin';
import { getMemberById } from '@/controllers/v1/member/get-member-by-id';
import { updateMemberStatus } from '@/controllers/v1/member/update-member-status';
import { updateMemberByAdmin } from '@/controllers/v1/member/update-member-by-admin';
import { getPendingMembers } from '@/controllers/v1/member/get-pending-members';
import { getAllMembers } from '@/controllers/v1/member/get-all-members';
import { archiveMember } from '@/controllers/v1/member/archive-member';
import { retrieveMember } from '@/controllers/v1/member/retrieve-member';
import { getCurrentMemberRequirements } from '@/controllers/v1/member/get-current-member-requirements';
import { upsertMemberRequirements } from '@/controllers/v1/member/upsert-member-requirements';
import { getCurrentOnboardingProgress } from '@/controllers/v1/member/get-current-onboarding-progress';
import { updatePreOrientationProgress } from '@/controllers/v1/member/update-preorientation-progress';
import { updateOnboardingStep } from '@/controllers/v1/member/update-onboarding-step';
import { getCurrentPaymentCheckout } from '@/controllers/v1/member/get-current-payment-checkout';
import { upsertPaymentCheckout } from '@/controllers/v1/member/upsert-payment-checkout';
import { getCurrentOnlineInterview } from '@/controllers/v1/member/get-current-online-interview';
import { upsertOnlineInterview } from '@/controllers/v1/member/upsert-online-interview';
import { getCurrentIdGenerationAsset } from '@/controllers/v1/member/get-current-id-generation-asset';
import { upsertIdGenerationAsset } from '@/controllers/v1/member/upsert-id-generation-asset';
import { getCurrentChaplaincyTrainingProgress } from '@/controllers/v1/member/get-current-chaplaincy-training-progress';
import { upsertChaplaincyTrainingProgress } from '@/controllers/v1/member/upsert-chaplaincy-training-progress';
import { createOfficerAssignmentByAdmin } from '@/controllers/v1/member/create-officer-assignment-by-admin';
import { getAllOfficerAssignments } from '@/controllers/v1/member/get-all-officer-assignments';
import { getMemberOfficerAssignments } from '@/controllers/v1/member/get-member-officer-assignments';
import { deactivateOfficerAssignmentByAdmin } from '@/controllers/v1/member/deactivate-officer-assignment-by-admin';
import { replaceOfficerAssignmentByAdmin } from '@/controllers/v1/member/replace-officer-assignment-by-admin';

/**
 * Helpers, Validators and Middlewares
 */
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { UserType } from '@/generated/prisma/enums';
import { validate } from '@/common/sanitation';
import { createUploadthingExpressHandler } from '@/lib/uploadthing';
import {
  applyMemberSchema,
  createMemberByAdminSchema,
  getAllMembersSchema,
  getMemberByIdSchema,
  updateOnboardingStepSchema,
  updatePreOrientationProgressSchema,
  upsertChaplaincyTrainingProgressSchema,
  upsertMemberIdGenerationAssetSchema,
  upsertOnlineInterviewAppointmentSchema,
  upsertPaymentCheckoutSchema,
  upsertMemberRequirementsSchema,
  updateMemberByAdminSchema,
  updateMemberStatusSchema,
  createOfficerAssignmentByAdminSchema,
  getAllOfficerAssignmentsSchema,
  getMemberOfficerAssignmentsSchema,
  deactivateOfficerAssignmentByAdminSchema,
  replaceOfficerAssignmentByAdminSchema,
} from '@/validators/member';

const router = Router();

router.post(
  '/apply',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  validate(applyMemberSchema),
  applyMember,
);

router.post(
  '/',
  expressRateLimit('auth'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createMemberByAdminSchema),
  createMemberByAdmin,
);

router.get(
  '/current/requirements',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  getCurrentMemberRequirements,
);

router.put(
  '/current/requirements',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  validate(upsertMemberRequirementsSchema),
  upsertMemberRequirements,
);

router.get(
  '/current/onboarding-progress',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  getCurrentOnboardingProgress,
);

router.put(
  '/current/onboarding-progress/step',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  validate(updateOnboardingStepSchema),
  updateOnboardingStep,
);

router.put(
  '/current/onboarding-progress/pre-orientation',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  validate(updatePreOrientationProgressSchema),
  updatePreOrientationProgress,
);

router.get(
  '/current/payment-checkout',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  getCurrentPaymentCheckout,
);

router.put(
  '/current/payment-checkout',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  validate(upsertPaymentCheckoutSchema),
  upsertPaymentCheckout,
);

router.get(
  '/current/online-interview',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  getCurrentOnlineInterview,
);

router.put(
  '/current/online-interview',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  validate(upsertOnlineInterviewAppointmentSchema),
  upsertOnlineInterview,
);

router.get(
  '/current/id-generation',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  getCurrentIdGenerationAsset,
);

router.put(
  '/current/id-generation',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  validate(upsertMemberIdGenerationAssetSchema),
  upsertIdGenerationAsset,
);

router.get(
  '/current/chaplaincy-training',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  getCurrentChaplaincyTrainingProgress,
);

router.put(
  '/current/chaplaincy-training',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  validate(upsertChaplaincyTrainingProgressSchema),
  upsertChaplaincyTrainingProgress,
);

router.use(
  '/requirements/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '4MB',
    maxFileCount: 1,
  }),
);

router.patch(
  '/:id/status',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateMemberStatusSchema),
  updateMemberStatus,
);

router.get(
  '/pending',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllMembersSchema),
  getPendingMembers,
);

router.get(
  '/officer-assignments',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllOfficerAssignmentsSchema),
  getAllOfficerAssignments,
);

router.get(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getMemberByIdSchema),
  getMemberById,
);

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllMembersSchema),
  getAllMembers,
);

router.put(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateMemberByAdminSchema),
  updateMemberByAdmin,
);

router.post(
  '/:id/officer-assignments',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createOfficerAssignmentByAdminSchema),
  createOfficerAssignmentByAdmin,
);

router.get(
  '/:id/officer-assignments',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getMemberOfficerAssignmentsSchema),
  getMemberOfficerAssignments,
);

router.patch(
  '/:id/officer-assignments/:assignmentId/deactivate',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(deactivateOfficerAssignmentByAdminSchema),
  deactivateOfficerAssignmentByAdmin,
);

router.post(
  '/:id/officer-assignments/:assignmentId/replace',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(replaceOfficerAssignmentByAdminSchema),
  replaceOfficerAssignmentByAdmin,
);

router.patch(
  '/:id/archive',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  archiveMember,
);

router.patch(
  '/:id/retrieve',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  retrieveMember,
);

export default router;
