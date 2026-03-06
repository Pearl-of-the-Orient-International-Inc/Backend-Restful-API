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
exports.defineExtension = exports.JsonNullValueFilter = exports.NullsOrder = exports.QueryMode = exports.JsonNullValueInput = exports.SortOrder = exports.OfficerAssignmentScalarFieldEnum = exports.OfficeTitleScalarFieldEnum = exports.BranchOfServiceScalarFieldEnum = exports.ApplicantSignatureScalarFieldEnum = exports.CharacterReferenceScalarFieldEnum = exports.MinisterialExperienceScalarFieldEnum = exports.MemberScalarFieldEnum = exports.PasskeyChallengeScalarFieldEnum = exports.PasskeyCredentialScalarFieldEnum = exports.VerificationCodeScalarFieldEnum = exports.SessionScalarFieldEnum = exports.UserTokenScalarFieldEnum = exports.UserScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.prismaVersion = exports.getExtensionContext = exports.Decimal = exports.Sql = exports.raw = exports.join = exports.empty = exports.sql = exports.PrismaClientValidationError = exports.PrismaClientInitializationError = exports.PrismaClientRustPanicError = exports.PrismaClientUnknownRequestError = exports.PrismaClientKnownRequestError = void 0;
const runtime = __importStar(require("@prisma/client/runtime/client"));
exports.PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
exports.PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
exports.PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
exports.PrismaClientInitializationError = runtime.PrismaClientInitializationError;
exports.PrismaClientValidationError = runtime.PrismaClientValidationError;
exports.sql = runtime.sqltag;
exports.empty = runtime.empty;
exports.join = runtime.join;
exports.raw = runtime.raw;
exports.Sql = runtime.Sql;
exports.Decimal = runtime.Decimal;
exports.getExtensionContext = runtime.Extensions.getExtensionContext;
exports.prismaVersion = {
    client: "7.4.0",
    engine: "ab56fe763f921d033a6c195e7ddeb3e255bdbb57"
};
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
    VerificationCode: 'VerificationCode',
    PasskeyCredential: 'PasskeyCredential',
    PasskeyChallenge: 'PasskeyChallenge',
    Member: 'Member',
    MinisterialExperience: 'MinisterialExperience',
    CharacterReference: 'CharacterReference',
    ApplicantSignature: 'ApplicantSignature',
    BranchOfService: 'BranchOfService',
    OfficeTitle: 'OfficeTitle',
    OfficerAssignment: 'OfficerAssignment'
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
    userId: 'userId',
    status: 'status',
    firstName: 'firstName',
    lastName: 'lastName',
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
    recentIdPhotoUrl: 'recentIdPhotoUrl',
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
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
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
exports.defineExtension = runtime.Extensions.defineExtension;
