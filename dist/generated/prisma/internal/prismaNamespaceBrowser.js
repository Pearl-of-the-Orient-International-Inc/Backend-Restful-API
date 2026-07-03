"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonNullValueFilter = exports.NullsOrder = exports.QueryMode = exports.JsonNullValueInput = exports.NullableJsonNullValueInput = exports.SortOrder = exports.DatabaseBackupSnapshotScalarFieldEnum = exports.DatabaseBackupSettingsScalarFieldEnum = exports.NewsBlogTaggedMemberScalarFieldEnum = exports.NewsBlogMediaScalarFieldEnum = exports.NewsBlogScalarFieldEnum = exports.EventTaggedMemberScalarFieldEnum = exports.EventAttendeeScalarFieldEnum = exports.EventScalarFieldEnum = exports.OfficerAssignmentScalarFieldEnum = exports.OfficeTitleScalarFieldEnum = exports.BranchOfServiceScalarFieldEnum = exports.SeminaryPaymentScalarFieldEnum = exports.SeminaryRequirementsScalarFieldEnum = exports.SeminaryApplicationScalarFieldEnum = exports.MemberChaplaincyTrainingProgressScalarFieldEnum = exports.MemberPublicRecordAttachmentScalarFieldEnum = exports.MemberPublicRecordScalarFieldEnum = exports.MemberCertificateScalarFieldEnum = exports.MemberIdGenerationAssetScalarFieldEnum = exports.MemberOnlineInterviewAppointmentScalarFieldEnum = exports.MemberPaymentCheckoutScalarFieldEnum = exports.MemberOnboardingProgressScalarFieldEnum = exports.ApplicantRequirementScalarFieldEnum = exports.ApplicantSignatureScalarFieldEnum = exports.CharacterReferenceScalarFieldEnum = exports.MinisterialExperienceScalarFieldEnum = exports.MemberFollowScalarFieldEnum = exports.MemberScalarFieldEnum = exports.PasskeyChallengeScalarFieldEnum = exports.PasskeyCredentialScalarFieldEnum = exports.VerificationCodeScalarFieldEnum = exports.ActivityLogScalarFieldEnum = exports.SessionScalarFieldEnum = exports.UserTokenScalarFieldEnum = exports.UserScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.Decimal = void 0;
const runtime = __importStar(require("@prisma/client/runtime/index-browser"));
exports.Decimal = runtime.Decimal;
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
exports.DbNull = runtime.DbNull;
exports.JsonNull = runtime.JsonNull;
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    User: 'User',
    UserToken: 'UserToken',
    Session: 'Session',
    ActivityLog: 'ActivityLog',
    VerificationCode: 'VerificationCode',
    PasskeyCredential: 'PasskeyCredential',
    PasskeyChallenge: 'PasskeyChallenge',
    Member: 'Member',
    MemberFollow: 'MemberFollow',
    MinisterialExperience: 'MinisterialExperience',
    CharacterReference: 'CharacterReference',
    ApplicantSignature: 'ApplicantSignature',
    ApplicantRequirement: 'ApplicantRequirement',
    MemberOnboardingProgress: 'MemberOnboardingProgress',
    MemberPaymentCheckout: 'MemberPaymentCheckout',
    MemberOnlineInterviewAppointment: 'MemberOnlineInterviewAppointment',
    MemberIdGenerationAsset: 'MemberIdGenerationAsset',
    MemberCertificate: 'MemberCertificate',
    MemberPublicRecord: 'MemberPublicRecord',
    MemberPublicRecordAttachment: 'MemberPublicRecordAttachment',
    MemberChaplaincyTrainingProgress: 'MemberChaplaincyTrainingProgress',
    SeminaryApplication: 'SeminaryApplication',
    SeminaryRequirements: 'SeminaryRequirements',
    SeminaryPayment: 'SeminaryPayment',
    BranchOfService: 'BranchOfService',
    OfficeTitle: 'OfficeTitle',
    OfficerAssignment: 'OfficerAssignment',
    Event: 'Event',
    EventAttendee: 'EventAttendee',
    EventTaggedMember: 'EventTaggedMember',
    NewsBlog: 'NewsBlog',
    NewsBlogMedia: 'NewsBlogMedia',
    NewsBlogTaggedMember: 'NewsBlogTaggedMember',
    DatabaseBackupSettings: 'DatabaseBackupSettings',
    DatabaseBackupSnapshot: 'DatabaseBackupSnapshot'
};
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.UserScalarFieldEnum = {
    id: 'id',
    name: 'name',
    email: 'email',
    password: 'password',
    avatar: 'avatar',
    position: 'position',
    accountStatus: 'accountStatus',
    isEmailVerified: 'isEmailVerified',
    isTwoFactorEnabled: 'isTwoFactorEnabled',
    twoFactorSecret: 'twoFactorSecret',
    role: 'role',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.UserTokenScalarFieldEnum = {
    id: 'id',
    refreshToken: 'refreshToken',
    expiredAt: 'expiredAt',
    userId: 'userId',
    sessionId: 'sessionId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SessionScalarFieldEnum = {
    id: 'id',
    ipAddress: 'ipAddress',
    userAgent: 'userAgent',
    expiredAt: 'expiredAt',
    createdAt: 'createdAt',
    userId: 'userId'
};
exports.ActivityLogScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    actorName: 'actorName',
    actorEmail: 'actorEmail',
    actorAvatar: 'actorAvatar',
    actionType: 'actionType',
    actionLabel: 'actionLabel',
    moduleLabel: 'moduleLabel',
    targetLabel: 'targetLabel',
    description: 'description',
    result: 'result',
    ipAddress: 'ipAddress',
    deviceLabel: 'deviceLabel',
    metadata: 'metadata',
    createdAt: 'createdAt'
};
exports.VerificationCodeScalarFieldEnum = {
    id: 'id',
    code: 'code',
    type: 'type',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
    userId: 'userId'
};
exports.PasskeyCredentialScalarFieldEnum = {
    id: 'id',
    credentialID: 'credentialID',
    publicKey: 'publicKey',
    counter: 'counter',
    deviceType: 'deviceType',
    backedUp: 'backedUp',
    transports: 'transports',
    label: 'label',
    userId: 'userId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.PasskeyChallengeScalarFieldEnum = {
    id: 'id',
    type: 'type',
    challenge: 'challenge',
    expiresAt: 'expiresAt',
    userId: 'userId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemberScalarFieldEnum = {
    id: 'id',
    uniqueId: 'uniqueId',
    userId: 'userId',
    status: 'status',
    memberType: 'memberType',
    badgeNumber: 'badgeNumber',
    profileBannerUrl: 'profileBannerUrl',
    profileBannerPositionY: 'profileBannerPositionY',
    firstName: 'firstName',
    middleInitial: 'middleInitial',
    lastName: 'lastName',
    extensionName: 'extensionName',
    mobilePhoneNumber: 'mobilePhoneNumber',
    homeAddress: 'homeAddress',
    civilStatus: 'civilStatus',
    gender: 'gender',
    nationality: 'nationality',
    dateOfBirth: 'dateOfBirth',
    region: 'region',
    province: 'province',
    municipalityCity: 'municipalityCity',
    barangay: 'barangay',
    emergencyContactName: 'emergencyContactName',
    emergencyContactMobile: 'emergencyContactMobile',
    churchAffiliation: 'churchAffiliation',
    churchAddress: 'churchAddress',
    currentPositionRole: 'currentPositionRole',
    currentPositionRoleOther: 'currentPositionRoleOther',
    height: 'height',
    weight: 'weight',
    bloodType: 'bloodType',
    colorOfEyes: 'colorOfEyes',
    colorOfSkin: 'colorOfSkin',
    sssNumber: 'sssNumber',
    tinNumber: 'tinNumber',
    skillsTalents: 'skillsTalents',
    preferredBranchOther: 'preferredBranchOther',
    elementarySchool: 'elementarySchool',
    secondarySchool: 'secondarySchool',
    tertiaryCollege: 'tertiaryCollege',
    postGraduateStudies: 'postGraduateStudies',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemberFollowScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    memberId: 'memberId',
    createdAt: 'createdAt'
};
exports.MinisterialExperienceScalarFieldEnum = {
    id: 'id',
    roleDescription: 'roleDescription',
    yearsApprox: 'yearsApprox',
    order: 'order',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.CharacterReferenceScalarFieldEnum = {
    id: 'id',
    name: 'name',
    positionRelationship: 'positionRelationship',
    contactNumber: 'contactNumber',
    order: 'order',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ApplicantSignatureScalarFieldEnum = {
    id: 'id',
    type: 'type',
    signatureData: 'signatureData',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ApplicantRequirementScalarFieldEnum = {
    id: 'id',
    type: 'type',
    reviewStatus: 'reviewStatus',
    fileUrl: 'fileUrl',
    fileName: 'fileName',
    mimeType: 'mimeType',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemberOnboardingProgressScalarFieldEnum = {
    id: 'id',
    currentStep: 'currentStep',
    preOrientationCompletedLessonIds: 'preOrientationCompletedLessonIds',
    preOrientationCompletedAt: 'preOrientationCompletedAt',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemberPaymentCheckoutScalarFieldEnum = {
    id: 'id',
    paymentMethod: 'paymentMethod',
    proofOfPaymentUrl: 'proofOfPaymentUrl',
    isPromissoryNote: 'isPromissoryNote',
    promissoryNoteUrl: 'promissoryNoteUrl',
    submittedAt: 'submittedAt',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemberOnlineInterviewAppointmentScalarFieldEnum = {
    id: 'id',
    interviewerId: 'interviewerId',
    interviewerName: 'interviewerName',
    day: 'day',
    timeSlot: 'timeSlot',
    zoomLink: 'zoomLink',
    meetingId: 'meetingId',
    passcode: 'passcode',
    confirmedAt: 'confirmedAt',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemberIdGenerationAssetScalarFieldEnum = {
    id: 'id',
    profileUrl: 'profileUrl',
    qrCodeUrl: 'qrCodeUrl',
    generatedAt: 'generatedAt',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemberCertificateScalarFieldEnum = {
    id: 'id',
    credentialId: 'credentialId',
    title: 'title',
    certificateUrl: 'certificateUrl',
    dateReceived: 'dateReceived',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemberPublicRecordScalarFieldEnum = {
    id: 'id',
    title: 'title',
    shortDescription: 'shortDescription',
    type: 'type',
    eventAt: 'eventAt',
    location: 'location',
    status: 'status',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemberPublicRecordAttachmentScalarFieldEnum = {
    id: 'id',
    fileUrl: 'fileUrl',
    fileName: 'fileName',
    mimeType: 'mimeType',
    sortOrder: 'sortOrder',
    publicRecordId: 'publicRecordId',
    createdAt: 'createdAt'
};
exports.MemberChaplaincyTrainingProgressScalarFieldEnum = {
    id: 'id',
    completedLessonIds: 'completedLessonIds',
    essayAnswers: 'essayAnswers',
    completedAt: 'completedAt',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryApplicationScalarFieldEnum = {
    id: 'id',
    status: 'status',
    targetMemberType: 'targetMemberType',
    studentId: 'studentId',
    academicYear: 'academicYear',
    surname: 'surname',
    givenName: 'givenName',
    middleName: 'middleName',
    emailAddress: 'emailAddress',
    mobilePhone: 'mobilePhone',
    homeAddress: 'homeAddress',
    dateOfBirth: 'dateOfBirth',
    birthPlace: 'birthPlace',
    age: 'age',
    gender: 'gender',
    height: 'height',
    weight: 'weight',
    civilStatus: 'civilStatus',
    officePhone: 'officePhone',
    churchAttended: 'churchAttended',
    churchAddress: 'churchAddress',
    pastorName: 'pastorName',
    contactNumber: 'contactNumber',
    ministryInvolved: 'ministryInvolved',
    programLevel: 'programLevel',
    programCourse: 'programCourse',
    highSchool: 'highSchool',
    highSchoolYearGraduated: 'highSchoolYearGraduated',
    collegeSchool: 'collegeSchool',
    collegeCourse: 'collegeCourse',
    collegeYearGraduated: 'collegeYearGraduated',
    vocationalSchool: 'vocationalSchool',
    vocationalCourse: 'vocationalCourse',
    vocationalYearGraduated: 'vocationalYearGraduated',
    othersSchool: 'othersSchool',
    othersCourse: 'othersCourse',
    othersYearGraduated: 'othersYearGraduated',
    submittedAt: 'submittedAt',
    reviewedAt: 'reviewedAt',
    reviewRemarks: 'reviewRemarks',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryRequirementsScalarFieldEnum = {
    id: 'id',
    transcriptOfRecordsUrl: 'transcriptOfRecordsUrl',
    transcriptOfRecordsFileName: 'transcriptOfRecordsFileName',
    transcriptOfRecordsMimeType: 'transcriptOfRecordsMimeType',
    transcriptOfRecordsFileSize: 'transcriptOfRecordsFileSize',
    idPictureUrl: 'idPictureUrl',
    idPictureFileName: 'idPictureFileName',
    idPictureMimeType: 'idPictureMimeType',
    idPictureFileSize: 'idPictureFileSize',
    pastorRecommendationUrl: 'pastorRecommendationUrl',
    pastorRecommendationFileName: 'pastorRecommendationFileName',
    pastorRecommendationMimeType: 'pastorRecommendationMimeType',
    pastorRecommendationFileSize: 'pastorRecommendationFileSize',
    briefHistoryOfConversion: 'briefHistoryOfConversion',
    applicationId: 'applicationId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryPaymentScalarFieldEnum = {
    id: 'id',
    paymentType: 'paymentType',
    paymentMethod: 'paymentMethod',
    amountPaid: 'amountPaid',
    totalAmountDue: 'totalAmountDue',
    status: 'status',
    submittedAt: 'submittedAt',
    verifiedAt: 'verifiedAt',
    reviewRemarks: 'reviewRemarks',
    proofOfReceiptUrl: 'proofOfReceiptUrl',
    proofOfReceiptFileName: 'proofOfReceiptFileName',
    proofOfReceiptMimeType: 'proofOfReceiptMimeType',
    proofOfReceiptFileSize: 'proofOfReceiptFileSize',
    applicationId: 'applicationId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.BranchOfServiceScalarFieldEnum = {
    id: 'id',
    title: 'title',
    description: 'description',
    sections: 'sections',
    memberId: 'memberId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.OfficeTitleScalarFieldEnum = {
    id: 'id',
    name: 'name',
    level: 'level',
    description: 'description',
    maxSlots: 'maxSlots',
    sections: 'sections',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.OfficerAssignmentScalarFieldEnum = {
    id: 'id',
    memberId: 'memberId',
    officeTitleId: 'officeTitleId',
    department: 'department',
    region: 'region',
    province: 'province',
    cityMunicipality: 'cityMunicipality',
    barangay: 'barangay',
    isActive: 'isActive',
    startDate: 'startDate',
    endDate: 'endDate',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.EventScalarFieldEnum = {
    id: 'id',
    name: 'name',
    category: 'category',
    type: 'type',
    location: 'location',
    onlineLink: 'onlineLink',
    meetingPlatform: 'meetingPlatform',
    meetingId: 'meetingId',
    meetingPassword: 'meetingPassword',
    description: 'description',
    thumbnailUrl: 'thumbnailUrl',
    organizer: 'organizer',
    startsAt: 'startsAt',
    endsAt: 'endsAt',
    status: 'status',
    visibility: 'visibility',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.EventAttendeeScalarFieldEnum = {
    id: 'id',
    eventId: 'eventId',
    memberId: 'memberId',
    accessLevel: 'accessLevel',
    inviteStatus: 'inviteStatus',
    invitedAt: 'invitedAt',
    updatedAt: 'updatedAt'
};
exports.EventTaggedMemberScalarFieldEnum = {
    id: 'id',
    eventId: 'eventId',
    memberId: 'memberId',
    taggedAt: 'taggedAt'
};
exports.NewsBlogScalarFieldEnum = {
    id: 'id',
    title: 'title',
    caption: 'caption',
    isActive: 'isActive',
    status: 'status',
    platform: 'platform',
    hashtags: 'hashtags',
    scheduledAt: 'scheduledAt',
    publishedAt: 'publishedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.NewsBlogMediaScalarFieldEnum = {
    id: 'id',
    newsBlogId: 'newsBlogId',
    kind: 'kind',
    fileUrl: 'fileUrl',
    fileName: 'fileName',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt'
};
exports.NewsBlogTaggedMemberScalarFieldEnum = {
    id: 'id',
    newsBlogId: 'newsBlogId',
    memberId: 'memberId',
    taggedAt: 'taggedAt'
};
exports.DatabaseBackupSettingsScalarFieldEnum = {
    id: 'id',
    automaticBackupEnabled: 'automaticBackupEnabled',
    frequency: 'frequency',
    retentionDays: 'retentionDays',
    nextRunAt: 'nextRunAt',
    lastUpdatedByUserId: 'lastUpdatedByUserId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.DatabaseBackupSnapshotScalarFieldEnum = {
    id: 'id',
    fileKey: 'fileKey',
    fileUrl: 'fileUrl',
    fileName: 'fileName',
    source: 'source',
    status: 'status',
    sizeBytes: 'sizeBytes',
    tableCount: 'tableCount',
    retentionDays: 'retentionDays',
    metadata: 'metadata',
    createdByUserId: 'createdByUserId',
    restoredAt: 'restoredAt',
    restoredByUserId: 'restoredByUserId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.NullableJsonNullValueInput = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull
};
exports.JsonNullValueInput = {
    JsonNull: exports.JsonNull
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.JsonNullValueFilter = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull,
    AnyNull: exports.AnyNull
};
