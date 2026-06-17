"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const apply_member_1 = require("../../controllers/v1/member/apply-member");
const create_member_by_admin_1 = require("../../controllers/v1/member/create-member-by-admin");
const get_member_by_id_1 = require("../../controllers/v1/member/get-member-by-id");
const update_member_status_1 = require("../../controllers/v1/member/update-member-status");
const update_member_by_admin_1 = require("../../controllers/v1/member/update-member-by-admin");
const update_member_unique_id_1 = require("../../controllers/v1/member/update-member-unique-id");
const change_member_password_by_admin_1 = require("../../controllers/v1/member/change-member-password-by-admin");
const delete_member_by_admin_1 = require("../../controllers/v1/member/delete-member-by-admin");
const get_pending_members_1 = require("../../controllers/v1/member/get-pending-members");
const get_all_members_1 = require("../../controllers/v1/member/get-all-members");
const get_membership_report_1 = require("../../controllers/v1/member/get-membership-report");
const archive_member_1 = require("../../controllers/v1/member/archive-member");
const retrieve_member_1 = require("../../controllers/v1/member/retrieve-member");
const get_current_member_requirements_1 = require("../../controllers/v1/member/get-current-member-requirements");
const upsert_member_requirements_1 = require("../../controllers/v1/member/upsert-member-requirements");
const get_current_onboarding_progress_1 = require("../../controllers/v1/member/get-current-onboarding-progress");
const update_preorientation_progress_1 = require("../../controllers/v1/member/update-preorientation-progress");
const update_onboarding_step_1 = require("../../controllers/v1/member/update-onboarding-step");
const get_current_payment_checkout_1 = require("../../controllers/v1/member/get-current-payment-checkout");
const upsert_payment_checkout_1 = require("../../controllers/v1/member/upsert-payment-checkout");
const get_current_online_interview_1 = require("../../controllers/v1/member/get-current-online-interview");
const upsert_online_interview_1 = require("../../controllers/v1/member/upsert-online-interview");
const get_current_id_generation_asset_1 = require("../../controllers/v1/member/get-current-id-generation-asset");
const upsert_id_generation_asset_1 = require("../../controllers/v1/member/upsert-id-generation-asset");
const get_current_chaplaincy_training_progress_1 = require("../../controllers/v1/member/get-current-chaplaincy-training-progress");
const upsert_chaplaincy_training_progress_1 = require("../../controllers/v1/member/upsert-chaplaincy-training-progress");
const get_current_profile_banner_1 = require("../../controllers/v1/member/get-current-profile-banner");
const update_current_profile_banner_1 = require("../../controllers/v1/member/update-current-profile-banner");
const update_current_church_affiliation_1 = require("../../controllers/v1/member/update-current-church-affiliation");
const update_current_education_1 = require("../../controllers/v1/member/update-current-education");
const update_current_branch_services_1 = require("../../controllers/v1/member/update-current-branch-services");
const create_current_member_certificate_1 = require("../../controllers/v1/member/create-current-member-certificate");
const create_current_member_public_record_1 = require("../../controllers/v1/member/create-current-member-public-record");
const create_officer_assignment_by_admin_1 = require("../../controllers/v1/member/create-officer-assignment-by-admin");
const get_all_officer_assignments_1 = require("../../controllers/v1/member/get-all-officer-assignments");
const get_member_officer_assignments_1 = require("../../controllers/v1/member/get-member-officer-assignments");
const deactivate_officer_assignment_by_admin_1 = require("../../controllers/v1/member/deactivate-officer-assignment-by-admin");
const replace_officer_assignment_by_admin_1 = require("../../controllers/v1/member/replace-officer-assignment-by-admin");
const get_public_member_profile_1 = require("../../controllers/v1/member/get-public-member-profile");
const get_public_directory_locations_1 = require("../../controllers/v1/member/get-public-directory-locations");
const express_rate_limiter_1 = require("../../middlewares/express-rate-limiter");
const authentication_1 = require("../../middlewares/authentication");
const authorization_1 = __importDefault(require("../../middlewares/authorization"));
const enums_1 = require("../../generated/prisma/enums");
const sanitation_1 = require("../../common/sanitation");
const uploadthing_1 = require("../../lib/uploadthing");
const member_1 = require("../../validators/member");
const router = (0, express_1.Router)();
router.post('/apply', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, sanitation_1.validate)(member_1.applyMemberSchema), apply_member_1.applyMember);
router.get('/public/directory-locations', (0, express_rate_limiter_1.expressRateLimit)('basic'), get_public_directory_locations_1.getPublicDirectoryLocations);
router.get('/public/:memberId', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, sanitation_1.validate)(member_1.getPublicMemberProfileSchema), get_public_member_profile_1.getPublicMemberProfile);
router.post('/', (0, express_rate_limiter_1.expressRateLimit)('auth'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.createMemberByAdminSchema), create_member_by_admin_1.createMemberByAdmin);
router.get('/current/profile-banner', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.OFFICER, enums_1.UserType.ADMIN]), get_current_profile_banner_1.getCurrentProfileBanner);
router.put('/current/profile-banner', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.OFFICER, enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.updateCurrentProfileBannerSchema), update_current_profile_banner_1.updateCurrentProfileBanner);
router.put('/current/church-affiliation', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.OFFICER, enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.updateCurrentChurchAffiliationSchema), update_current_church_affiliation_1.updateCurrentChurchAffiliation);
router.put('/current/education', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.OFFICER, enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.updateCurrentEducationSchema), update_current_education_1.updateCurrentEducation);
router.put('/current/branch-services', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.OFFICER, enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.updateCurrentBranchServicesSchema), update_current_branch_services_1.updateCurrentBranchServices);
router.post('/current/certificates', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.OFFICER, enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.createCurrentMemberCertificateSchema), create_current_member_certificate_1.createCurrentMemberCertificate);
router.post('/current/public-records', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.OFFICER, enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.createCurrentMemberPublicRecordSchema), create_current_member_public_record_1.createCurrentMemberPublicRecord);
router.get('/current/requirements', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), get_current_member_requirements_1.getCurrentMemberRequirements);
router.put('/current/requirements', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(member_1.upsertMemberRequirementsSchema), upsert_member_requirements_1.upsertMemberRequirements);
router.get('/current/onboarding-progress', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), get_current_onboarding_progress_1.getCurrentOnboardingProgress);
router.put('/current/onboarding-progress/step', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(member_1.updateOnboardingStepSchema), update_onboarding_step_1.updateOnboardingStep);
router.put('/current/onboarding-progress/pre-orientation', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(member_1.updatePreOrientationProgressSchema), update_preorientation_progress_1.updatePreOrientationProgress);
router.get('/current/payment-checkout', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), get_current_payment_checkout_1.getCurrentPaymentCheckout);
router.put('/current/payment-checkout', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(member_1.upsertPaymentCheckoutSchema), upsert_payment_checkout_1.upsertPaymentCheckout);
router.get('/current/online-interview', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), get_current_online_interview_1.getCurrentOnlineInterview);
router.put('/current/online-interview', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(member_1.upsertOnlineInterviewAppointmentSchema), upsert_online_interview_1.upsertOnlineInterview);
router.get('/current/id-generation', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), get_current_id_generation_asset_1.getCurrentIdGenerationAsset);
router.put('/current/id-generation', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(member_1.upsertMemberIdGenerationAssetSchema), upsert_id_generation_asset_1.upsertIdGenerationAsset);
router.get('/current/chaplaincy-training', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), get_current_chaplaincy_training_progress_1.getCurrentChaplaincyTrainingProgress);
router.put('/current/chaplaincy-training', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(member_1.upsertChaplaincyTrainingProgressSchema), upsert_chaplaincy_training_progress_1.upsertChaplaincyTrainingProgress);
router.use('/profile-banner/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '8MB',
    maxFileCount: 1,
}));
router.use('/certificates/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '16MB',
    maxFileCount: 1,
}));
router.use('/public-records/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '8MB',
    maxFileCount: 6,
}));
router.use('/requirements/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '4MB',
    maxFileCount: 1,
}));
router.patch('/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.updateMemberStatusSchema), update_member_status_1.updateMemberStatus);
router.get('/pending', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.getAllMembersSchema), get_pending_members_1.getPendingMembers);
router.get('/reports/membership', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.getMembershipReportSchema), get_membership_report_1.getMembershipReport);
router.get('/officer-assignments', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.getAllOfficerAssignmentsSchema), get_all_officer_assignments_1.getAllOfficerAssignments);
router.get('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.getMemberByIdSchema), get_member_by_id_1.getMemberById);
router.get('/', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.getAllMembersSchema), get_all_members_1.getAllMembers);
router.put('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.updateMemberByAdminSchema), update_member_by_admin_1.updateMemberByAdmin);
router.patch('/:id/unique-id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.updateMemberUniqueIdSchema), update_member_unique_id_1.updateMemberUniqueId);
router.patch('/:id/password', (0, express_rate_limiter_1.expressRateLimit)('passwordReset'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.changeMemberPasswordByAdminSchema), change_member_password_by_admin_1.changeMemberPasswordByAdmin);
router.post('/:id/officer-assignments', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.createOfficerAssignmentByAdminSchema), create_officer_assignment_by_admin_1.createOfficerAssignmentByAdmin);
router.get('/:id/officer-assignments', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.getMemberOfficerAssignmentsSchema), get_member_officer_assignments_1.getMemberOfficerAssignments);
router.patch('/:id/officer-assignments/:assignmentId/deactivate', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.deactivateOfficerAssignmentByAdminSchema), deactivate_officer_assignment_by_admin_1.deactivateOfficerAssignmentByAdmin);
router.post('/:id/officer-assignments/:assignmentId/replace', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.replaceOfficerAssignmentByAdminSchema), replace_officer_assignment_by_admin_1.replaceOfficerAssignmentByAdmin);
router.patch('/:id/archive', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), archive_member_1.archiveMember);
router.patch('/:id/retrieve', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), retrieve_member_1.retrieveMember);
router.delete('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(member_1.deleteMemberByAdminSchema), delete_member_by_admin_1.deleteMemberByAdmin);
exports.default = router;
