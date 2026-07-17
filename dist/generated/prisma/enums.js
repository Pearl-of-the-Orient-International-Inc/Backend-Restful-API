"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupSnapshotStatus = exports.BackupSnapshotSource = exports.BackupFrequency = exports.NewsBlogMediaKind = exports.NewsBlogPlatform = exports.NewsBlogStatus = exports.EventAttendeeInviteStatus = exports.EventAttendeeAccessLevel = exports.EventMeetingPlatform = exports.EventVisibility = exports.EventStatus = exports.EventType = exports.EventCategory = exports.OfficeTitleLevel = exports.InterviewDay = exports.SeminaryCredentialDocumentStatus = exports.SeminaryCredentialDocumentType = exports.SeminaryPaymentStatus = exports.SeminaryPaymentMethod = exports.SeminaryPaymentType = exports.SeminaryProgramLevel = exports.SeminarySchoolAffiliation = exports.SeminaryEnrollmentType = exports.SeminaryStudentStatus = exports.SeminaryApplicationStatus = exports.MemberPaymentMethod = exports.MemberOnboardingStep = exports.RequirementReviewStatus = exports.ApplicantRequirementType = exports.SignatureType = exports.Gender = exports.CivilStatus = exports.PasskeyChallengeType = exports.VerificationType = exports.MemberPublicRecordStatus = exports.MemberPublicRecordType = exports.MemberType = exports.MemberStatus = exports.ActivityLogResult = exports.ActivityLogActionType = exports.UserAccountStatus = exports.UserPosition = exports.UserType = void 0;
exports.UserType = {
    MEMBER: 'MEMBER',
    OFFICER: 'OFFICER',
    ADMIN: 'ADMIN'
};
exports.UserPosition = {
    CLERK: 'CLERK',
    REGISTRAR: 'REGISTRAR',
    HR: 'HR',
    IT: 'IT',
    ACCOUNTING_FINANCE: 'ACCOUNTING_FINANCE',
    OPERATIONS: 'OPERATIONS',
    SECRETARIAN: 'SECRETARIAN'
};
exports.UserAccountStatus = {
    ACTIVE: 'ACTIVE',
    PENDING: 'PENDING',
    SUSPENDED: 'SUSPENDED'
};
exports.ActivityLogActionType = {
    AUTH: 'AUTH',
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    EXPORT: 'EXPORT',
    INVITE: 'INVITE',
    ASSIGN: 'ASSIGN',
    REVIEW: 'REVIEW',
    SECURITY: 'SECURITY'
};
exports.ActivityLogResult = {
    SUCCESS: 'SUCCESS',
    WARNING: 'WARNING',
    FAILED: 'FAILED'
};
exports.MemberStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
};
exports.MemberType = {
    ASSOCIATE_CHAPLAIN: 'ASSOCIATE_CHAPLAIN',
    PROFESSIONAL_CHAPLAIN: 'PROFESSIONAL_CHAPLAIN',
    ORDAINED_AND_COMMISSIONED_PRACTITIONER: 'ORDAINED_AND_COMMISSIONED_PRACTITIONER',
    CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR: 'CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR'
};
exports.MemberPublicRecordType = {
    REPORT_ACTIVITY: 'REPORT_ACTIVITY',
    COMMUNITY_SERVICE: 'COMMUNITY_SERVICE',
    TRAINING_CONDUCTED: 'TRAINING_CONDUCTED',
    PARTICIPATION: 'PARTICIPATION',
    RECOGNITION: 'RECOGNITION'
};
exports.MemberPublicRecordStatus = {
    PUBLISHED: 'PUBLISHED',
    DRAFT: 'DRAFT'
};
exports.VerificationType = {
    EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
    PASSWORD_RESET: 'PASSWORD_RESET',
    TWO_FACTOR: 'TWO_FACTOR'
};
exports.PasskeyChallengeType = {
    REGISTRATION: 'REGISTRATION',
    AUTHENTICATION: 'AUTHENTICATION'
};
exports.CivilStatus = {
    SINGLE: 'SINGLE',
    MARRIED: 'MARRIED',
    WIDOWED: 'WIDOWED',
    SEPARATED: 'SEPARATED',
    ANNULLED: 'ANNULLED'
};
exports.Gender = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY'
};
exports.SignatureType = {
    DRAWN: 'DRAWN',
    UPLOADED: 'UPLOADED'
};
exports.ApplicantRequirementType = {
    PHOTO_2X2: 'PHOTO_2X2',
    HS_BACCALAUREATE_DIPLOMA: 'HS_BACCALAUREATE_DIPLOMA',
    TWO_THREE_YEAR_PROGRAM_DIPLOMA: 'TWO_THREE_YEAR_PROGRAM_DIPLOMA',
    MASTERS_DEGREE_DIPLOMA: 'MASTERS_DEGREE_DIPLOMA',
    DOCTORAL_DEGREE_DIPLOMA: 'DOCTORAL_DEGREE_DIPLOMA',
    ORDINATION_CERTIFICATE: 'ORDINATION_CERTIFICATE',
    PASTORS_RECOMMENDATION_LETTER: 'PASTORS_RECOMMENDATION_LETTER',
    LETTER_OF_INTENT: 'LETTER_OF_INTENT',
    ENDORSEMENT_LETTERS: 'ENDORSEMENT_LETTERS',
    MARRIAGE_CONTRACT: 'MARRIAGE_CONTRACT',
    CLEARANCE_BARANGAY: 'CLEARANCE_BARANGAY',
    CLEARANCE_POLICE: 'CLEARANCE_POLICE',
    CLEARANCE_NBI: 'CLEARANCE_NBI'
};
exports.RequirementReviewStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
};
exports.MemberOnboardingStep = {
    REQUIREMENTS: 'REQUIREMENTS',
    PRE_ORIENTATION: 'PRE_ORIENTATION',
    PAYMENT_CHECKOUT: 'PAYMENT_CHECKOUT',
    ONLINE_INTERVIEW: 'ONLINE_INTERVIEW',
    ID_GENERATION: 'ID_GENERATION',
    CHAPLAINCY_101: 'CHAPLAINCY_101',
    OATH_TAKING: 'OATH_TAKING'
};
exports.MemberPaymentMethod = {
    E_WALLET: 'E_WALLET',
    DIRECT_DEBIT: 'DIRECT_DEBIT',
    OVER_THE_COUNTER: 'OVER_THE_COUNTER',
    CASH: 'CASH'
};
exports.SeminaryApplicationStatus = {
    SUBMITTED: 'SUBMITTED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED'
};
exports.SeminaryStudentStatus = {
    ACTIVE: 'ACTIVE',
    GRADUATING: 'GRADUATING',
    LEAVE_OF_ABSENCE: 'LEAVE_OF_ABSENCE',
    INACTIVE: 'INACTIVE'
};
exports.SeminaryEnrollmentType = {
    REGULAR: 'REGULAR',
    TRANSFEREE: 'TRANSFEREE',
    CROSS_ENROLLEE: 'CROSS_ENROLLEE'
};
exports.SeminarySchoolAffiliation = {
    IN_HOUSE: 'IN_HOUSE',
    PARTNER_SCHOOL: 'PARTNER_SCHOOL'
};
exports.SeminaryProgramLevel = {
    CERTIFICATE: 'CERTIFICATE',
    BACHELOR: 'BACHELOR',
    MASTER_WITH_THESIS: 'MASTER_WITH_THESIS',
    DOCTORATE_WITH_DISSERTATION: 'DOCTORATE_WITH_DISSERTATION'
};
exports.SeminaryPaymentType = {
    FULL_PAYMENT: 'FULL_PAYMENT',
    PARTIAL_PAYMENT: 'PARTIAL_PAYMENT'
};
exports.SeminaryPaymentMethod = {
    BANK_TRANSFER: 'BANK_TRANSFER',
    GCASH: 'GCASH',
    MAYA: 'MAYA'
};
exports.SeminaryPaymentStatus = {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED'
};
exports.SeminaryCredentialDocumentType = {
    DIPLOMA: 'DIPLOMA',
    CERTIFICATE: 'CERTIFICATE',
    TRANSCRIPT: 'TRANSCRIPT'
};
exports.SeminaryCredentialDocumentStatus = {
    ACTIVE: 'ACTIVE',
    REVOKED: 'REVOKED',
    VOID: 'VOID'
};
exports.InterviewDay = {
    SATURDAY: 'SATURDAY',
    SUNDAY: 'SUNDAY'
};
exports.OfficeTitleLevel = {
    CHIEF_CHAPLAIN: 'CHIEF_CHAPLAIN',
    NATIONAL_CHAPLAIN_DIRECTOR: 'NATIONAL_CHAPLAIN_DIRECTOR',
    REGIONAL_CHAPLAIN_DIRECTOR: 'REGIONAL_CHAPLAIN_DIRECTOR',
    REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR: 'REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR',
    PROVINCIAL_CHAPLAIN_DIRECTOR: 'PROVINCIAL_CHAPLAIN_DIRECTOR',
    PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR: 'PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR',
    CITY_CHAPLAIN: 'CITY_CHAPLAIN',
    MUNICIPAL_CHAPLAIN: 'MUNICIPAL_CHAPLAIN',
    CITY_MUNICIPAL_DEPUTY_CHAPLAIN: 'CITY_MUNICIPAL_DEPUTY_CHAPLAIN',
    BARANGAY_CHAPLAIN: 'BARANGAY_CHAPLAIN',
    BARANGAY_DEPUTY_CHAPLAIN: 'BARANGAY_DEPUTY_CHAPLAIN'
};
exports.EventCategory = {
    CONFERENCE: 'CONFERENCE',
    OUTREACH: 'OUTREACH',
    TRAINING: 'TRAINING',
    WORSHIP: 'WORSHIP',
    ORIENTATION: 'ORIENTATION',
    SEMINAR: 'SEMINAR',
    FELLOWSHIP: 'FELLOWSHIP',
    PRAYER: 'PRAYER',
    OTHER: 'OTHER'
};
exports.EventType = {
    ONSITE: 'ONSITE',
    ONLINE: 'ONLINE'
};
exports.EventStatus = {
    SCHEDULED: 'SCHEDULED',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};
exports.EventVisibility = {
    PUBLIC: 'PUBLIC',
    PRIVATE: 'PRIVATE'
};
exports.EventMeetingPlatform = {
    ZOOM: 'ZOOM',
    GOOGLE_MEET: 'GOOGLE_MEET',
    MICROSOFT_TEAMS: 'MICROSOFT_TEAMS',
    OTHER: 'OTHER'
};
exports.EventAttendeeAccessLevel = {
    FULL_ACCESS: 'FULL_ACCESS'
};
exports.EventAttendeeInviteStatus = {
    INVITED: 'INVITED',
    ACCEPTED: 'ACCEPTED'
};
exports.NewsBlogStatus = {
    DRAFT: 'DRAFT',
    SCHEDULED: 'SCHEDULED',
    PUBLISHED: 'PUBLISHED'
};
exports.NewsBlogPlatform = {
    FACEBOOK: 'FACEBOOK'
};
exports.NewsBlogMediaKind = {
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO'
};
exports.BackupFrequency = {
    HOURLY: 'HOURLY',
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY'
};
exports.BackupSnapshotSource = {
    MANUAL: 'MANUAL',
    AUTOMATIC: 'AUTOMATIC'
};
exports.BackupSnapshotStatus = {
    READY: 'READY',
    IN_PROGRESS: 'IN_PROGRESS',
    FAILED: 'FAILED'
};
