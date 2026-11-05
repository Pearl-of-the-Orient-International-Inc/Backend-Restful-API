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
import { updateMemberUniqueId } from '@/controllers/v1/member/update-member-unique-id';
import { changeMemberPasswordByAdmin } from '@/controllers/v1/member/change-member-password-by-admin';
import { verifyMemberEmailByAdmin } from '@/controllers/v1/member/verify-member-email-by-admin';
import { verifyMemberCredentialDocument } from '@/controllers/v1/member/verify-member-credential-document';
import { deleteMemberByAdmin } from '@/controllers/v1/member/delete-member-by-admin';
import { generateMemberCredentialDocument } from '@/controllers/v1/member/generate-member-credential-document';
import { getPendingMembers } from '@/controllers/v1/member/get-pending-members';
import { getAllMembers } from '@/controllers/v1/member/get-all-members';
import { getMembershipReport } from '@/controllers/v1/member/get-membership-report';
import { archiveMember } from '@/controllers/v1/member/archive-member';
import { retrieveMember } from '@/controllers/v1/member/retrieve-member';
import { sendMemberRenewalEmail } from '@/controllers/v1/member/send-member-renewal-email';
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
import { getCurrentProfileBanner } from '@/controllers/v1/member/get-current-profile-banner';
import { updateCurrentProfileBanner } from '@/controllers/v1/member/update-current-profile-banner';
import { updateCurrentChurchAffiliation } from '@/controllers/v1/member/update-current-church-affiliation';
import { updateCurrentEducation } from '@/controllers/v1/member/update-current-education';
import { updateCurrentBranchServices } from '@/controllers/v1/member/update-current-branch-services';
import { createCurrentMemberCertificate } from '@/controllers/v1/member/create-current-member-certificate';
import { createMemberCertificateByAdmin } from '@/controllers/v1/member/create-member-certificate-by-admin';
import { createCurrentMemberPublicRecord } from '@/controllers/v1/member/create-current-member-public-record';
import { createOfficerAssignmentByAdmin } from '@/controllers/v1/member/create-officer-assignment-by-admin';
import { getAllOfficerAssignments } from '@/controllers/v1/member/get-all-officer-assignments';
import { getMemberOfficerAssignments } from '@/controllers/v1/member/get-member-officer-assignments';
import { deactivateOfficerAssignmentByAdmin } from '@/controllers/v1/member/deactivate-officer-assignment-by-admin';
import { replaceOfficerAssignmentByAdmin } from '@/controllers/v1/member/replace-officer-assignment-by-admin';
import { updateOfficerAssignmentPublication } from '@/controllers/v1/member/update-officer-assignment-publication';
import { updateOfficerAssignmentByAdmin } from '@/controllers/v1/member/update-officer-assignment-by-admin';
import { getCurrentOfficerScope } from '@/controllers/v1/member/get-current-officer-scope';
import { getCurrentOfficerMembers } from '@/controllers/v1/member/get-current-officer-members';
import { getPublicMemberProfile } from '@/controllers/v1/member/get-public-member-profile';
import { getPublicDirectoryLocations } from '@/controllers/v1/member/get-public-directory-locations';
import { getPublicServiceChaplains } from '@/controllers/v1/member/get-public-service-chaplains';
import { getPublicMemberSearch } from '@/controllers/v1/member/get-public-member-search';
import { getMemberFollowStatus } from '@/controllers/v1/member/get-member-follow-status';
import { followMember } from '@/controllers/v1/member/follow-member';
import { unfollowMember } from '@/controllers/v1/member/unfollow-member';
import { createReferralCriterion, getCurrentReferral, getPublicHonorRoll, resolvePublicReferral, rotateCurrentReferral, getReferralCriteria, getPublicReferralCriteria, updateReferralCriterion, lockHonorRoll } from '@/controllers/v1/member/referrals';
import {
  createCurrentServiceAvailability,
  deleteCurrentServiceAvailability,
  getCurrentServiceAvailability,
  getPublicServiceAvailability,
} from '@/controllers/v1/member/service-availability';
import {
  deleteCurrentServiceLicense,
  updateCurrentServiceLicense,
} from '@/controllers/v1/member/service-license';

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
  getMembershipReportSchema,
  getMemberByIdSchema,
  updateOnboardingStepSchema,
  updatePreOrientationProgressSchema,
  upsertChaplaincyTrainingProgressSchema,
  updateCurrentProfileBannerSchema,
  updateCurrentChurchAffiliationSchema,
  updateCurrentEducationSchema,
  updateCurrentBranchServicesSchema,
  createCurrentMemberCertificateSchema,
  createMemberCertificateByAdminSchema,
  createCurrentMemberPublicRecordSchema,
  upsertMemberIdGenerationAssetSchema,
  upsertOnlineInterviewAppointmentSchema,
  upsertPaymentCheckoutSchema,
  upsertMemberRequirementsSchema,
  updateMemberByAdminSchema,
  updateMemberStatusSchema,
  updateMemberUniqueIdSchema,
  changeMemberPasswordByAdminSchema,
  verifyMemberEmailByAdminSchema,
  deleteMemberByAdminSchema,
  generateMemberCredentialDocumentSchema,
  verifyMemberCredentialDocumentSchema,
  createOfficerAssignmentByAdminSchema,
  getAllOfficerAssignmentsSchema,
  getMemberOfficerAssignmentsSchema,
  getPublicMemberProfileSchema,
  deactivateOfficerAssignmentByAdminSchema,
  replaceOfficerAssignmentByAdminSchema,
  updateOfficerAssignmentPublicationSchema,
  updateOfficerAssignmentByAdminSchema,
  createCurrentServiceAvailabilitySchema,
  deleteCurrentServiceAvailabilitySchema,
  getPublicServiceAvailabilitySchema,
  updateCurrentServiceLicenseSchema,
} from '@/validators/member';

const router = Router();

router.post(
  '/apply',
  expressRateLimit('basic'),
  validate(applyMemberSchema),
  applyMember,
);

router.get('/referrals/resolve/:code', expressRateLimit('basic'), resolvePublicReferral);
router.get('/honor-roll', expressRateLimit('basic'), getPublicHonorRoll);
router.get('/referral-criteria/public', expressRateLimit('basic'), getPublicReferralCriteria);
router.get('/referral-criteria', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), getReferralCriteria);
router.post('/referral-criteria', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), createReferralCriterion);
router.put('/referral-criteria/:key', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), updateReferralCriterion);
router.post('/honor-roll/:period/lock', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), lockHonorRoll);

router.get(
  '/current/referral',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  getCurrentReferral,
);
router.post(
  '/current/referral/rotate',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  rotateCurrentReferral,
);

router.get(
  '/public/directory-locations',
  expressRateLimit('basic'),
  getPublicDirectoryLocations,
);

router.get(
  '/public/service-chaplains',
  expressRateLimit('basic'),
  getPublicServiceChaplains,
);

router.get(
  '/public/search',
  expressRateLimit('basic'),
  getPublicMemberSearch,
);

router.get(
  '/public/:memberId/service-availability',
  expressRateLimit('basic'),
  validate(getPublicServiceAvailabilitySchema),
  getPublicServiceAvailability,
);

router.get(
  '/public/:memberId/follow',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  getMemberFollowStatus,
);

router.post(
  '/public/:memberId/follow',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  followMember,
);

router.delete(
  '/public/:memberId/follow',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  unfollowMember,
);

router.get(
  '/public/:memberId',
  expressRateLimit('basic'),
  validate(getPublicMemberProfileSchema),
  getPublicMemberProfile,
);

router.get(
  '/credential-documents/verify/:token',
  expressRateLimit('basic'),
  validate(verifyMemberCredentialDocumentSchema),
  verifyMemberCredentialDocument,
);

router.post(
  '/',
  expressRateLimit('auth'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createMemberByAdminSchema),
  createMemberByAdmin,
);

// Current-member cover photo management for the public profile page.
router.get(
  '/current/profile-banner',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  getCurrentProfileBanner,
);

router.put(
  '/current/profile-banner',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  validate(updateCurrentProfileBannerSchema),
  updateCurrentProfileBanner,
);

router.put(
  '/current/church-affiliation',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  validate(updateCurrentChurchAffiliationSchema),
  updateCurrentChurchAffiliation,
);

router.put(
  '/current/education',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  validate(updateCurrentEducationSchema),
  updateCurrentEducation,
);

router.put(
  '/current/branch-services',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  validate(updateCurrentBranchServicesSchema),
  updateCurrentBranchServices,
);

router.get(
  '/current/service-availability',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  getCurrentServiceAvailability,
);

router.post(
  '/current/service-availability',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  validate(createCurrentServiceAvailabilitySchema),
  createCurrentServiceAvailability,
);

router.delete(
  '/current/service-availability/:slotId',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  validate(deleteCurrentServiceAvailabilitySchema),
  deleteCurrentServiceAvailability,
);

router.put(
  '/current/service-license',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  validate(updateCurrentServiceLicenseSchema),
  updateCurrentServiceLicense,
);

router.delete(
  '/current/service-license',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  deleteCurrentServiceLicense,
);

router.post(
  '/current/certificates',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  validate(createCurrentMemberCertificateSchema),
  createCurrentMemberCertificate,
);

router.post(
  '/current/public-records',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]),
  validate(createCurrentMemberPublicRecordSchema),
  createCurrentMemberPublicRecord,
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
  '/profile-banner/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '8MB',
    maxFileCount: 1,
  }),
);

router.use(
  '/certificates/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '16MB',
    maxFileCount: 1,
  }),
);

router.use(
  '/public-records/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '8MB',
    maxFileCount: 6,
  }),
);

router.use(
  '/requirements/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '4MB',
    maxFileCount: 1,
  }),
);

router.put(
  '/:id/officer-assignments/:assignmentId',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateOfficerAssignmentByAdminSchema),
  updateOfficerAssignmentByAdmin,
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
  '/reports/membership',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getMembershipReportSchema),
  getMembershipReport,
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
  '/officer-scope',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.OFFICER]),
  getCurrentOfficerScope,
);

router.get(
  '/officer-scope/members',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.OFFICER]),
  getCurrentOfficerMembers,
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

router.patch(
  '/:id/unique-id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateMemberUniqueIdSchema),
  updateMemberUniqueId,
);

router.patch(
  '/:id/password',
  expressRateLimit('passwordReset'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(changeMemberPasswordByAdminSchema),
  changeMemberPasswordByAdmin,
);

router.patch(
  '/:id/verify-email',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(verifyMemberEmailByAdminSchema),
  verifyMemberEmailByAdmin,
);

router.post(
  '/:id/credential-documents',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(generateMemberCredentialDocumentSchema),
  generateMemberCredentialDocument,
);

router.post(
  '/:id/certificates',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createMemberCertificateByAdminSchema),
  createMemberCertificateByAdmin,
);

router.post(
  '/:id/renewal-email',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  sendMemberRenewalEmail,
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
  '/:id/officer-assignments/:assignmentId/publication',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateOfficerAssignmentPublicationSchema),
  updateOfficerAssignmentPublication,
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

router.delete(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(deleteMemberByAdminSchema),
  deleteMemberByAdmin,
);

export default router;
