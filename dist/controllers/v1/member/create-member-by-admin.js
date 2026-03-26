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
exports.createMemberByAdmin = void 0;
const crypto_1 = require("crypto");
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const password_hash_1 = require("../../../lib/password-hash");
const mailers_1 = require("../../../mailers");
const welcome_user_1 = require("../../../mailers/templates/welcome-user");
const enums_1 = require("../../../generated/prisma/enums");
const getOptional = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const buildFullName = (firstName, lastName) => [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
const generateTemporaryPassword = () => `Pearl!${(0, crypto_1.randomBytes)(5).toString('hex').toUpperCase()}9`;
const userSelect = {
    id: true,
    name: true,
    email: true,
    avatar: true,
    role: true,
    position: true,
    accountStatus: true,
    isEmailVerified: true,
    isTwoFactorEnabled: true,
    createdAt: true,
    updatedAt: true,
};
const createMemberByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
                email: true,
                name: true,
                role: true,
                memberProfile: { select: { id: true } },
            },
        });
        if (existingUser === null || existingUser === void 0 ? void 0 : existingUser.memberProfile) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'A member profile already exists for this email address',
            });
            return;
        }
        if (existingUser && existingUser.role !== enums_1.UserType.MEMBER) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'This email is already assigned to a non-member account',
            });
            return;
        }
        const temporaryPassword = existingUser ? null : generateTemporaryPassword();
        const hashedPassword = temporaryPassword ? yield (0, password_hash_1.hashValue)(temporaryPassword) : null;
        const displayName = buildFullName(body.firstName, body.lastName);
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const user = existingUser
                ? yield tx.user.findUniqueOrThrow({
                    where: { id: existingUser.id },
                    select: userSelect,
                })
                : yield tx.user.create({
                    data: {
                        name: displayName,
                        email: normalizedEmail,
                        password: hashedPassword,
                        role: enums_1.UserType.MEMBER,
                        accountStatus: enums_1.UserAccountStatus.ACTIVE,
                        isEmailVerified: true,
                    },
                    select: userSelect,
                });
            const createData = {
                user: { connect: { id: user.id } },
                firstName: body.firstName.trim(),
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
                    signature: true,
                    ministerialExperiences: true,
                    characterReferences: true,
                    preferredBranches: {
                        select: { id: true, title: true },
                    },
                    user: {
                        select: userSelect,
                    },
                },
            });
            return {
                user,
                member,
                createdUser: !existingUser,
            };
        }));
        if (temporaryPassword) {
            const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: normalizedEmail }, (0, welcome_user_1.welcomeUserTemplate)(displayName, normalizedEmail, temporaryPassword)));
            if (!emailResult.success) {
                winston_1.logger.warn('Member account created but welcome email failed to send', {
                    email: normalizedEmail,
                    memberId: result.member.id,
                });
            }
        }
        winston_1.logger.info('Member profile created by admin', {
            memberId: result.member.id,
            userId: result.user.id,
            createdUser: result.createdUser,
            adminUserId: req.userId,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Member profile created successfully',
            data: result,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating member by admin', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.createMemberByAdmin = createMemberByAdmin;
