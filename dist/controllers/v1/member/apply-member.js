"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyMember = void 0;
const crypto_1 = require("crypto");
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const password_hash_1 = require("../../../lib/password-hash");
const member_unique_id_1 = require("../../../lib/member-unique-id");
const helpers_1 = require("../../../lib/helpers");
const verification_redirect_1 = require("../../../lib/verification-redirect");
const mailers_1 = require("../../../mailers");
const verify_email_1 = require("../../../mailers/templates/verify-email");
const welcome_member_1 = require("../../../mailers/templates/welcome-member");
const client_1 = require("../../../generated/prisma/client");
const MAX_MEMBER_CREATE_ATTEMPTS = 5;
const getOptional = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const buildFullName = (firstName, middleName, lastName, extensionName) => [firstName.trim(), middleName === null || middleName === void 0 ? void 0 : middleName.trim(), lastName === null || lastName === void 0 ? void 0 : lastName.trim(), extensionName === null || extensionName === void 0 ? void 0 : extensionName.trim()]
    .filter(Boolean)
    .join(' ');
const generateTemporaryPassword = () => `Pearl!${(0, crypto_1.randomBytes)(5).toString('hex').toUpperCase()}9`;
const isRetryableCreateConflict = (error) => {
    if (!error || typeof error !== 'object' || !('code' in error)) {
        return false;
    }
    const code = error.code;
    return code === 'P2002' || code === 'P2034';
};
const applyMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const body = req.body;
        const normalizedEmail = body.email.trim().toLowerCase();
        const preferredBranchIds = (_a = body.preferredBranchIds) !== null && _a !== void 0 ? _a : [];
        if (preferredBranchIds.length > 0) {
            const branchCount = yield prisma_1.prisma.branchOfService.count({
                where: { id: { in: preferredBranchIds } },
            });
            if (branchCount !== preferredBranchIds.length) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'One or more preferredBranchIds are invalid',
                });
                return;
            }
        }
        const existingUser = yield prisma_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                accountStatus: true,
                isEmailVerified: true,
                memberProfile: { select: { id: true } },
            },
        });
        if (existingUser === null || existingUser === void 0 ? void 0 : existingUser.memberProfile) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'A member application already exists for this email address',
            });
            return;
        }
        const temporaryPassword = existingUser ? null : generateTemporaryPassword();
        const hashedPassword = temporaryPassword ? yield (0, password_hash_1.hashValue)(temporaryPassword) : null;
        const displayName = buildFullName(body.firstName, body.middleInitial, body.lastName, body.extensionName);
        let result = null;
        for (let attempt = 1; attempt <= MAX_MEMBER_CREATE_ATTEMPTS; attempt += 1) {
            try {
                result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e;
                    const user = existingUser
                        ? yield tx.user.update({
                            where: { id: existingUser.id },
                            data: {
                                name: displayName,
                                email: normalizedEmail,
                                accountStatus: 'PENDING',
                            },
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                accountStatus: true,
                                isEmailVerified: true,
                            },
                        })
                        : yield tx.user.create({
                            data: {
                                name: displayName,
                                email: normalizedEmail,
                                password: hashedPassword,
                                role: 'MEMBER',
                                accountStatus: 'PENDING',
                                isEmailVerified: false,
                            },
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                accountStatus: true,
                                isEmailVerified: true,
                            },
                        });
                    const uniqueId = yield (0, member_unique_id_1.generateNextMemberUniqueId)(user.role, tx);
                    const verificationCode = user.isEmailVerified
                        ? null
                        : yield tx.verificationCode.upsert({
                            where: {
                                userId: user.id,
                            },
                            update: {
                                type: enums_1.VerificationType.EMAIL_VERIFICATION,
                                expiresAt: (0, helpers_1.calculateExpirationDate)('1h'),
                                code: (0, crypto_1.randomBytes)(16).toString('hex'),
                            },
                            create: {
                                userId: user.id,
                                type: enums_1.VerificationType.EMAIL_VERIFICATION,
                                expiresAt: (0, helpers_1.calculateExpirationDate)('1h'),
                                code: (0, crypto_1.randomBytes)(16).toString('hex'),
                            },
                        });
                    const createData = {
                        user: { connect: { id: user.id } },
                        uniqueId,
                        firstName: body.firstName.trim(),
                        extensionName: getOptional(body.extensionName),
                        middleInitial: getOptional(body.middleInitial),
                        lastName: body.lastName.trim(),
                        mobilePhoneNumber: getOptional(body.mobilePhoneNumber),
                        homeAddress: getOptional(body.homeAddress),
                        civilStatus: (_a = body.civilStatus) !== null && _a !== void 0 ? _a : null,
                        gender: body.gender,
                        nationality: getOptional(body.nationality),
                        dateOfBirth: new Date(body.dateOfBirth),
                        region: getOptional(body.region),
                        province: getOptional(body.province),
                        municipalityCity: getOptional(body.municipalityCity),
                        barangay: getOptional(body.barangay),
                        emergencyContactName: getOptional(body.emergencyContactName),
                        emergencyContactMobile: getOptional(body.emergencyContactMobile),
                        churchAffiliation: getOptional(body.churchAffiliation),
                        churchAddress: getOptional(body.churchAddress),
                        currentPositionRole: getOptional(body.currentPositionRole),
                        currentPositionRoleOther: getOptional(body.currentPositionRoleOther),
                        height: getOptional(body.height),
                        weight: getOptional(body.weight),
                        bloodType: getOptional(body.bloodType),
                        colorOfEyes: getOptional(body.colorOfEyes),
                        colorOfSkin: getOptional(body.colorOfSkin),
                        sssNumber: getOptional(body.sssNumber),
                        tinNumber: getOptional(body.tinNumber),
                        skillsTalents: getOptional(body.skillsTalents),
                        preferredBranchOther: getOptional(body.preferredBranchOther),
                        elementarySchool: getOptional(body.elementarySchool),
                        secondarySchool: getOptional(body.secondarySchool),
                        tertiaryCollege: getOptional(body.tertiaryCollege),
                        postGraduateStudies: getOptional(body.postGraduateStudies),
                        ministerialExperiences: {
                            create: (_c = (_b = body.ministerialExperiences) === null || _b === void 0 ? void 0 : _b.map((item, index) => ({
                                roleDescription: item.roleDescription,
                                yearsApprox: item.yearsApprox,
                                order: index + 1,
                            }))) !== null && _c !== void 0 ? _c : [],
                        },
                        characterReferences: {
                            create: (_e = (_d = body.characterReferences) === null || _d === void 0 ? void 0 : _d.map((item, index) => ({
                                name: item.name,
                                positionRelationship: item.positionRelationship,
                                contactNumber: item.contactNumber,
                                order: index + 1,
                            }))) !== null && _e !== void 0 ? _e : [],
                        },
                    };
                    if (preferredBranchIds.length > 0) {
                        createData.preferredBranches = {
                            connect: preferredBranchIds.map((id) => ({ id })),
                        };
                    }
                    if (body.signature) {
                        createData.signature = {
                            create: {
                                type: body.signature.type,
                                signatureData: body.signature.signatureData,
                            },
                        };
                    }
                    const member = yield tx.member.create({
                        data: createData,
                        include: {
                            ministerialExperiences: true,
                            characterReferences: true,
                            signature: true,
                            preferredBranches: {
                                select: { id: true, title: true },
                            },
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    accountStatus: true,
                                    isEmailVerified: true,
                                },
                            },
                        },
                    });
                    return {
                        member,
                        verificationUrl: verificationCode
                            ? (0, verification_redirect_1.buildVerificationUrl)(user.role, verificationCode.code)
                            : null,
                        createdUser: !existingUser,
                    };
                }), {
                    isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
                });
                break;
            }
            catch (error) {
                if (attempt < MAX_MEMBER_CREATE_ATTEMPTS && isRetryableCreateConflict(error)) {
                    winston_1.logger.warn('Retrying member application creation after transaction conflict', {
                        email: normalizedEmail,
                        attempt,
                    });
                    continue;
                }
                throw error;
            }
        }
        if (!result) {
            throw new Error('Unable to create member application after retrying');
        }
        if (result.createdUser && temporaryPassword) {
            const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: normalizedEmail }, (0, welcome_member_1.welcomeMemberTemplate)(displayName, normalizedEmail, temporaryPassword, (_b = result.verificationUrl) !== null && _b !== void 0 ? _b : undefined)));
            if (!emailResult.success && result.verificationUrl) {
                yield (0, mailers_1.sendMail)(Object.assign({ sendTo: normalizedEmail }, (0, verify_email_1.verifyEmailTemplate)(result.verificationUrl, displayName)));
            }
        }
        else if (result.verificationUrl) {
            yield (0, mailers_1.sendMail)(Object.assign({ sendTo: normalizedEmail }, (0, verify_email_1.verifyEmailTemplate)(result.verificationUrl, displayName)));
        }
        winston_1.logger.info('Member application submitted', {
            memberId: result.member.id,
            userId: result.member.user.id,
            email: normalizedEmail,
            createdUser: result.createdUser,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Member application submitted successfully. Please check your email to verify your account credentials.',
            data: result.member,
            meta: {
                createdUser: result.createdUser,
                isEmailVerified: result.member.user.isEmailVerified,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while applying as member', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.applyMember = applyMember;
