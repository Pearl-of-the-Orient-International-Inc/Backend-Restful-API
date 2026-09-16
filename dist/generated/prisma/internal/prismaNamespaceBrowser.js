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
exports.AccountingAcknowledgementReceiptItemScalarFieldEnum = exports.AccountingAcknowledgementReceiptScalarFieldEnum = exports.AccountingReceivableItemScalarFieldEnum = exports.AccountingReceivableScalarFieldEnum = exports.AccountingPayableItemScalarFieldEnum = exports.AccountingPayableScalarFieldEnum = exports.SeminaryFeeCollectionAccountScalarFieldEnum = exports.SeminaryFeeConfigurationScalarFieldEnum = exports.SeminaryGradeConfigurationScalarFieldEnum = exports.SeminaryInstructorScalarFieldEnum = exports.SeminaryAcademicYearScalarFieldEnum = exports.SeminaryStudentNotificationScalarFieldEnum = exports.SeminaryGradeRecordScalarFieldEnum = exports.SeminaryExaminationScalarFieldEnum = exports.SeminaryAssignmentScalarFieldEnum = exports.SeminaryStudyMaterialScalarFieldEnum = exports.SeminaryCourseScalarFieldEnum = exports.SeminaryPaymentScalarFieldEnum = exports.SeminaryRequirementsScalarFieldEnum = exports.SeminaryCredentialDocumentScalarFieldEnum = exports.SeminaryApplicationScalarFieldEnum = exports.MemberChaplaincyTrainingProgressScalarFieldEnum = exports.MemberPublicRecordAttachmentScalarFieldEnum = exports.MemberPublicRecordScalarFieldEnum = exports.MemberCredentialDocumentScalarFieldEnum = exports.MemberCertificateScalarFieldEnum = exports.MemberIdGenerationAssetScalarFieldEnum = exports.MemberOnlineInterviewAppointmentScalarFieldEnum = exports.MemberPaymentCheckoutScalarFieldEnum = exports.MemberOnboardingProgressScalarFieldEnum = exports.ApplicantRequirementScalarFieldEnum = exports.ApplicantSignatureScalarFieldEnum = exports.CharacterReferenceScalarFieldEnum = exports.MinisterialExperienceScalarFieldEnum = exports.MemberFollowScalarFieldEnum = exports.MemberScalarFieldEnum = exports.PasskeyChallengeScalarFieldEnum = exports.PasskeyCredentialScalarFieldEnum = exports.VerificationCodeScalarFieldEnum = exports.ActivityLogScalarFieldEnum = exports.SessionScalarFieldEnum = exports.UserTokenScalarFieldEnum = exports.UserScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.Decimal = void 0;
exports.JsonNullValueFilter = exports.NullsOrder = exports.QueryMode = exports.JsonNullValueInput = exports.NullableJsonNullValueInput = exports.SortOrder = exports.DatabaseBackupSnapshotScalarFieldEnum = exports.DatabaseBackupSettingsScalarFieldEnum = exports.MemoDeliveryLogScalarFieldEnum = exports.MemoAttachmentScalarFieldEnum = exports.MemoRecipientScalarFieldEnum = exports.MemoAnnouncementScalarFieldEnum = exports.PaymentTransactionScalarFieldEnum = exports.ChaplainProductOrderScalarFieldEnum = exports.ChaplainProductScalarFieldEnum = exports.BulletinEntryScalarFieldEnum = exports.NewsBlogTaggedMemberScalarFieldEnum = exports.NewsBlogMediaScalarFieldEnum = exports.NewsBlogScalarFieldEnum = exports.EventTaggedMemberScalarFieldEnum = exports.EventAttendeeScalarFieldEnum = exports.EventScalarFieldEnum = exports.OfficerAssignmentScalarFieldEnum = exports.OfficeTitleScalarFieldEnum = exports.BranchOfServiceScalarFieldEnum = exports.TaskItemScalarFieldEnum = exports.TaskBoardScalarFieldEnum = exports.OwnerAccessCredentialScalarFieldEnum = exports.AccountingLedgerTransactionScalarFieldEnum = void 0;
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
    MemberCredentialDocument: 'MemberCredentialDocument',
    MemberPublicRecord: 'MemberPublicRecord',
    MemberPublicRecordAttachment: 'MemberPublicRecordAttachment',
    MemberChaplaincyTrainingProgress: 'MemberChaplaincyTrainingProgress',
    SeminaryApplication: 'SeminaryApplication',
    SeminaryCredentialDocument: 'SeminaryCredentialDocument',
    SeminaryRequirements: 'SeminaryRequirements',
    SeminaryPayment: 'SeminaryPayment',
    SeminaryCourse: 'SeminaryCourse',
    SeminaryStudyMaterial: 'SeminaryStudyMaterial',
    SeminaryAssignment: 'SeminaryAssignment',
    SeminaryExamination: 'SeminaryExamination',
    SeminaryGradeRecord: 'SeminaryGradeRecord',
    SeminaryStudentNotification: 'SeminaryStudentNotification',
    SeminaryAcademicYear: 'SeminaryAcademicYear',
    SeminaryInstructor: 'SeminaryInstructor',
    SeminaryGradeConfiguration: 'SeminaryGradeConfiguration',
    SeminaryFeeConfiguration: 'SeminaryFeeConfiguration',
    SeminaryFeeCollectionAccount: 'SeminaryFeeCollectionAccount',
    AccountingPayable: 'AccountingPayable',
    AccountingPayableItem: 'AccountingPayableItem',
    AccountingReceivable: 'AccountingReceivable',
    AccountingReceivableItem: 'AccountingReceivableItem',
    AccountingAcknowledgementReceipt: 'AccountingAcknowledgementReceipt',
    AccountingAcknowledgementReceiptItem: 'AccountingAcknowledgementReceiptItem',
    AccountingLedgerTransaction: 'AccountingLedgerTransaction',
    OwnerAccessCredential: 'OwnerAccessCredential',
    TaskBoard: 'TaskBoard',
    TaskItem: 'TaskItem',
    BranchOfService: 'BranchOfService',
    OfficeTitle: 'OfficeTitle',
    OfficerAssignment: 'OfficerAssignment',
    Event: 'Event',
    EventAttendee: 'EventAttendee',
    EventTaggedMember: 'EventTaggedMember',
    NewsBlog: 'NewsBlog',
    NewsBlogMedia: 'NewsBlogMedia',
    NewsBlogTaggedMember: 'NewsBlogTaggedMember',
    BulletinEntry: 'BulletinEntry',
    ChaplainProduct: 'ChaplainProduct',
    ChaplainProductOrder: 'ChaplainProductOrder',
    PaymentTransaction: 'PaymentTransaction',
    MemoAnnouncement: 'MemoAnnouncement',
    MemoRecipient: 'MemoRecipient',
    MemoAttachment: 'MemoAttachment',
    MemoDeliveryLog: 'MemoDeliveryLog',
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
exports.MemberCredentialDocumentScalarFieldEnum = {
    id: 'id',
    documentNumber: 'documentNumber',
    barcodeNumber: 'barcodeNumber',
    verificationToken: 'verificationToken',
    type: 'type',
    status: 'status',
    title: 'title',
    issuedAt: 'issuedAt',
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
    admissionNumber: 'admissionNumber',
    studentId: 'studentId',
    studentStatus: 'studentStatus',
    enrollmentType: 'enrollmentType',
    schoolAffiliation: 'schoolAffiliation',
    yearLevel: 'yearLevel',
    academicYear: 'academicYear',
    surname: 'surname',
    givenName: 'givenName',
    middleName: 'middleName',
    emailAddress: 'emailAddress',
    mobilePhone: 'mobilePhone',
    mailingAddress: 'mailingAddress',
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
exports.SeminaryCredentialDocumentScalarFieldEnum = {
    id: 'id',
    documentNumber: 'documentNumber',
    barcodeNumber: 'barcodeNumber',
    verificationToken: 'verificationToken',
    type: 'type',
    status: 'status',
    title: 'title',
    remarks: 'remarks',
    issuedAt: 'issuedAt',
    revokedAt: 'revokedAt',
    applicationId: 'applicationId',
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
exports.SeminaryCourseScalarFieldEnum = {
    id: 'id',
    courseName: 'courseName',
    courseCode: 'courseCode',
    program: 'program',
    units: 'units',
    modality: 'modality',
    subjects: 'subjects',
    status: 'status',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryStudyMaterialScalarFieldEnum = {
    id: 'id',
    title: 'title',
    subtitle: 'subtitle',
    subject: 'subject',
    type: 'type',
    status: 'status',
    fileUrl: 'fileUrl',
    fileName: 'fileName',
    mimeType: 'mimeType',
    fileSize: 'fileSize',
    downloads: 'downloads',
    uploadedByName: 'uploadedByName',
    uploadedByRole: 'uploadedByRole',
    uploadedByUserId: 'uploadedByUserId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryAssignmentScalarFieldEnum = {
    id: 'id',
    title: 'title',
    description: 'description',
    subject: 'subject',
    courseId: 'courseId',
    courseName: 'courseName',
    courseCode: 'courseCode',
    instructorUserId: 'instructorUserId',
    instructorName: 'instructorName',
    assignmentType: 'assignmentType',
    dueAt: 'dueAt',
    status: 'status',
    totalMarks: 'totalMarks',
    additionalInstructions: 'additionalInstructions',
    allowLateSubmission: 'allowLateSubmission',
    lateSubmissionDeadline: 'lateSubmissionDeadline',
    notifyStudents: 'notifyStudents',
    attachmentLabel: 'attachmentLabel',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryExaminationScalarFieldEnum = {
    id: 'id',
    title: 'title',
    coverage: 'coverage',
    subject: 'subject',
    courseId: 'courseId',
    courseName: 'courseName',
    courseCode: 'courseCode',
    instructorUserId: 'instructorUserId',
    instructorName: 'instructorName',
    examType: 'examType',
    scheduledAt: 'scheduledAt',
    durationMinutes: 'durationMinutes',
    status: 'status',
    totalPoints: 'totalPoints',
    passingScore: 'passingScore',
    instructions: 'instructions',
    randomizeQuestions: 'randomizeQuestions',
    showResults: 'showResults',
    questions: 'questions',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryGradeRecordScalarFieldEnum = {
    id: 'id',
    recordNumber: 'recordNumber',
    studentApplicationId: 'studentApplicationId',
    studentId: 'studentId',
    studentName: 'studentName',
    program: 'program',
    programLevel: 'programLevel',
    subject: 'subject',
    courseId: 'courseId',
    courseTitle: 'courseTitle',
    courseCode: 'courseCode',
    instructorUserId: 'instructorUserId',
    instructorName: 'instructorName',
    term: 'term',
    finalGrade: 'finalGrade',
    remarks: 'remarks',
    status: 'status',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryStudentNotificationScalarFieldEnum = {
    id: 'id',
    studentApplicationId: 'studentApplicationId',
    studentId: 'studentId',
    studentName: 'studentName',
    studentEmail: 'studentEmail',
    title: 'title',
    message: 'message',
    type: 'type',
    assignmentId: 'assignmentId',
    readAt: 'readAt',
    createdAt: 'createdAt'
};
exports.SeminaryAcademicYearScalarFieldEnum = {
    id: 'id',
    academicYear: 'academicYear',
    session: 'session',
    status: 'status',
    startDate: 'startDate',
    endDate: 'endDate',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryInstructorScalarFieldEnum = {
    id: 'id',
    userId: 'userId',
    facultyId: 'facultyId',
    name: 'name',
    professionalTitle: 'professionalTitle',
    email: 'email',
    contactNumber: 'contactNumber',
    teachingPrograms: 'teachingPrograms',
    rank: 'rank',
    status: 'status',
    loadUnits: 'loadUnits',
    biography: 'biography',
    educationalBackground: 'educationalBackground',
    areasOfExpertise: 'areasOfExpertise',
    credentials: 'credentials',
    formalPhotoUrl: 'formalPhotoUrl',
    isFilipinoCitizen: 'isFilipinoCitizen',
    highSchoolGraduateOrEquivalent: 'highSchoolGraduateOrEquivalent',
    ministerialExperienceYears: 'ministerialExperienceYears',
    submissionDeadline: 'submissionDeadline',
    attendanceParticipation: 'attendanceParticipation',
    leadershipCharacter: 'leadershipCharacter',
    ministryCommunityEngagement: 'ministryCommunityEngagement',
    knowledgeSkillsAssessment: 'knowledgeSkillsAssessment',
    professionalConductEthics: 'professionalConductEthics',
    totalScore: 'totalScore',
    rating: 'rating',
    rankingClassification: 'rankingClassification',
    award: 'award',
    inviteTokenSentAt: 'inviteTokenSentAt',
    inviteAcceptedAt: 'inviteAcceptedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryGradeConfigurationScalarFieldEnum = {
    id: 'id',
    passingEquivalent: 'passingEquivalent',
    releaseWindow: 'releaseWindow',
    weightProfile: 'weightProfile',
    completionWindowDays: 'completionWindowDays',
    approvalWorkflow: 'approvalWorkflow',
    allowFacultyOverride: 'allowFacultyOverride',
    autoPublishApproved: 'autoPublishApproved',
    showConditionalRemark: 'showConditionalRemark',
    gradeScale: 'gradeScale',
    criteriaWeights: 'criteriaWeights',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryFeeConfigurationScalarFieldEnum = {
    id: 'id',
    feeBreakdowns: 'feeBreakdowns',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SeminaryFeeCollectionAccountScalarFieldEnum = {
    id: 'id',
    referenceNumber: 'referenceNumber',
    studentId: 'studentId',
    studentName: 'studentName',
    program: 'program',
    programLevel: 'programLevel',
    totalCharges: 'totalCharges',
    amountPaid: 'amountPaid',
    balance: 'balance',
    dueDate: 'dueDate',
    paymentMethod: 'paymentMethod',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AccountingPayableScalarFieldEnum = {
    id: 'id',
    billNo: 'billNo',
    supplier: 'supplier',
    category: 'category',
    billDate: 'billDate',
    dueDate: 'dueDate',
    reference: 'reference',
    description: 'description',
    paymentTerms: 'paymentTerms',
    paymentMethod: 'paymentMethod',
    bankAccount: 'bankAccount',
    remarks: 'remarks',
    discount: 'discount',
    tax: 'tax',
    totalAmount: 'totalAmount',
    paidAmount: 'paidAmount',
    status: 'status',
    attachments: 'attachments',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AccountingPayableItemScalarFieldEnum = {
    id: 'id',
    description: 'description',
    category: 'category',
    quantity: 'quantity',
    unitCost: 'unitCost',
    amount: 'amount',
    sortOrder: 'sortOrder',
    payableId: 'payableId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AccountingReceivableScalarFieldEnum = {
    id: 'id',
    invoiceNo: 'invoiceNo',
    customer: 'customer',
    invoiceDate: 'invoiceDate',
    dueDate: 'dueDate',
    reference: 'reference',
    description: 'description',
    paymentTerms: 'paymentTerms',
    paymentMethod: 'paymentMethod',
    bankAccount: 'bankAccount',
    notes: 'notes',
    discount: 'discount',
    tax: 'tax',
    totalAmount: 'totalAmount',
    paidAmount: 'paidAmount',
    status: 'status',
    attachments: 'attachments',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AccountingReceivableItemScalarFieldEnum = {
    id: 'id',
    description: 'description',
    account: 'account',
    quantity: 'quantity',
    unitPrice: 'unitPrice',
    amount: 'amount',
    sortOrder: 'sortOrder',
    receivableId: 'receivableId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AccountingAcknowledgementReceiptScalarFieldEnum = {
    id: 'id',
    receiptNo: 'receiptNo',
    organization: 'organization',
    name: 'name',
    receiptDate: 'receiptDate',
    course: 'course',
    school: 'school',
    paymentType: 'paymentType',
    checkNo: 'checkNo',
    cashier: 'cashier',
    remarks: 'remarks',
    totalAmount: 'totalAmount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AccountingAcknowledgementReceiptItemScalarFieldEnum = {
    id: 'id',
    particulars: 'particulars',
    amount: 'amount',
    remarks: 'remarks',
    sortOrder: 'sortOrder',
    receiptId: 'receiptId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AccountingLedgerTransactionScalarFieldEnum = {
    id: 'id',
    transactionNo: 'transactionNo',
    transactionDate: 'transactionDate',
    type: 'type',
    party: 'party',
    note: 'note',
    account: 'account',
    accountNo: 'accountNo',
    category: 'category',
    debit: 'debit',
    credit: 'credit',
    status: 'status',
    reference: 'reference',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.OwnerAccessCredentialScalarFieldEnum = {
    id: 'id',
    pinHash: 'pinHash',
    lastLoginAt: 'lastLoginAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.TaskBoardScalarFieldEnum = {
    id: 'id',
    title: 'title',
    color: 'color',
    sortOrder: 'sortOrder',
    isDefault: 'isDefault',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.TaskItemScalarFieldEnum = {
    id: 'id',
    code: 'code',
    title: 'title',
    priority: 'priority',
    dueDate: 'dueDate',
    progress: 'progress',
    sortOrder: 'sortOrder',
    boardId: 'boardId',
    assigneeId: 'assigneeId',
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
    isPublic: 'isPublic',
    sortOrder: 'sortOrder',
    reportsToId: 'reportsToId',
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
    isPublic: 'isPublic',
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
    facebookPostId: 'facebookPostId',
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
exports.BulletinEntryScalarFieldEnum = {
    id: 'id',
    title: 'title',
    content: 'content',
    type: 'type',
    status: 'status',
    publicationDate: 'publicationDate',
    scheduledAt: 'scheduledAt',
    authorName: 'authorName',
    issuingOffice: 'issuingOffice',
    featuredImageUrl: 'featuredImageUrl',
    featuredImageFileName: 'featuredImageFileName',
    attachmentUrl: 'attachmentUrl',
    attachmentFileName: 'attachmentFileName',
    attachmentMimeType: 'attachmentMimeType',
    authorUserId: 'authorUserId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ChaplainProductScalarFieldEnum = {
    id: 'id',
    slug: 'slug',
    name: 'name',
    description: 'description',
    category: 'category',
    price: 'price',
    stockQuantity: 'stockQuantity',
    lowStockThreshold: 'lowStockThreshold',
    imageUrl: 'imageUrl',
    imageFileName: 'imageFileName',
    isActive: 'isActive',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.ChaplainProductOrderScalarFieldEnum = {
    id: 'id',
    orderNumber: 'orderNumber',
    checkoutToken: 'checkoutToken',
    productId: 'productId',
    quantity: 'quantity',
    unitPrice: 'unitPrice',
    subtotal: 'subtotal',
    taxAmount: 'taxAmount',
    platformFee: 'platformFee',
    total: 'total',
    customerUserId: 'customerUserId',
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    customerPhone: 'customerPhone',
    fulfillmentMethod: 'fulfillmentMethod',
    deliveryAddress: 'deliveryAddress',
    customerNotes: 'customerNotes',
    paymentMethod: 'paymentMethod',
    paymentStatus: 'paymentStatus',
    paymentGateway: 'paymentGateway',
    providerCheckoutId: 'providerCheckoutId',
    providerCheckoutUrl: 'providerCheckoutUrl',
    status: 'status',
    inventoryReleasedAt: 'inventoryReleasedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.PaymentTransactionScalarFieldEnum = {
    id: 'id',
    reference: 'reference',
    amount: 'amount',
    currency: 'currency',
    purpose: 'purpose',
    payerReference: 'payerReference',
    gateway: 'gateway',
    gatewayReference: 'gatewayReference',
    checkoutUrl: 'checkoutUrl',
    status: 'status',
    providerStatus: 'providerStatus',
    failureReason: 'failureReason',
    metadata: 'metadata',
    paidAt: 'paidAt',
    expiresAt: 'expiresAt',
    chaplainProductOrderId: 'chaplainProductOrderId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemoAnnouncementScalarFieldEnum = {
    id: 'id',
    referenceNumber: 'referenceNumber',
    title: 'title',
    category: 'category',
    customCategory: 'customCategory',
    status: 'status',
    summary: 'summary',
    documentName: 'documentName',
    docxFilePath: 'docxFilePath',
    pdfFilePath: 'pdfFilePath',
    pages: 'pages',
    authorUserId: 'authorUserId',
    publishedAt: 'publishedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.MemoRecipientScalarFieldEnum = {
    id: 'id',
    memoId: 'memoId',
    userId: 'userId',
    memberId: 'memberId',
    name: 'name',
    email: 'email',
    type: 'type',
    createdAt: 'createdAt'
};
exports.MemoAttachmentScalarFieldEnum = {
    id: 'id',
    memoId: 'memoId',
    kind: 'kind',
    fileName: 'fileName',
    filePath: 'filePath',
    mimeType: 'mimeType',
    fileSize: 'fileSize',
    createdAt: 'createdAt'
};
exports.MemoDeliveryLogScalarFieldEnum = {
    id: 'id',
    memoId: 'memoId',
    recipientId: 'recipientId',
    email: 'email',
    status: 'status',
    messageId: 'messageId',
    error: 'error',
    sentAt: 'sentAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
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
