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
exports.updateMemberByAdmin = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const enums_1 = require("@/generated/prisma/enums");
const getOptional = (value) => {
    const normalized = value === null || value === void 0 ? void 0 : value.trim();
    return normalized ? normalized : null;
};
const buildFullName = (firstName, lastName) => [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
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
const updateMemberByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const memberId = req.params.id;
        if (!memberId || Array.isArray(memberId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid member ID',
            });
            return;
        }
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
        const existingMember = yield prisma_1.prisma.member.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                userId: true,
                signature: { select: { id: true } },
            },
        });
        if (!existingMember) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member not found',
            });
            return;
        }
        const conflictingUser = yield prisma_1.prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                role: true,
            },
        });
        if (conflictingUser && conflictingUser.id !== existingMember.userId) {
            if (conflictingUser.role !== enums_1.UserType.MEMBER) {
                res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                    code: 'CONFLICT',
                    message: 'This email is already assigned to a non-member account',
                });
                return;
            }
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'This email is already assigned to another member account',
            });
            return;
        }
        const displayName = buildFullName(body.firstName, body.lastName);
        const updatedMember = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            yield tx.user.update({
                where: { id: existingMember.userId },
                data: {
                    name: displayName,
                    email: normalizedEmail,
                },
            });
            const updateData = {
                badgeNumber: getOptional(body.badgeNumber),
                firstName: body.firstName.trim(),
                middleInitial: getOptional(body.middleInitial),
                lastName: body.lastName.trim(),
                extensionName: getOptional(body.extensionName),
                memberType: (_a = body.memberType) !== null && _a !== void 0 ? _a : enums_1.MemberType.ASSOCIATE_CHAPLAIN,
                mobilePhoneNumber: getOptional(body.mobilePhoneNumber),
                homeAddress: getOptional(body.homeAddress),
                civilStatus: (_b = body.civilStatus) !== null && _b !== void 0 ? _b : null,
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
                    deleteMany: {},
                    create: (_d = (_c = body.ministerialExperiences) === null || _c === void 0 ? void 0 : _c.map((item, index) => ({
                        roleDescription: item.roleDescription,
                        yearsApprox: item.yearsApprox,
                        order: index + 1,
                    }))) !== null && _d !== void 0 ? _d : [],
                },
                characterReferences: {
                    deleteMany: {},
                    create: (_f = (_e = body.characterReferences) === null || _e === void 0 ? void 0 : _e.map((item, index) => ({
                        name: item.name,
                        positionRelationship: item.positionRelationship,
                        contactNumber: item.contactNumber,
                        order: index + 1,
                    }))) !== null && _f !== void 0 ? _f : [],
                },
                preferredBranches: {
                    set: preferredBranchIds.map((id) => ({ id })),
                },
            };
            if ('profileBannerUrl' in body) {
                updateData.profileBannerUrl = getOptional(body.profileBannerUrl);
            }
            if (typeof body.profileBannerPositionY === 'number') {
                updateData.profileBannerPositionY = body.profileBannerPositionY;
            }
            if (body.createdAt) {
                updateData.createdAt = new Date(body.createdAt);
            }
            if (body.signature) {
                updateData.signature = {
                    upsert: {
                        create: {
                            type: body.signature.type,
                            signatureData: body.signature.signatureData,
                        },
                        update: {
                            type: body.signature.type,
                            signatureData: body.signature.signatureData,
                        },
                    },
                };
            }
            else if (existingMember.signature) {
                updateData.signature = {
                    delete: true,
                };
            }
            return tx.member.update({
                where: { id: memberId },
                data: updateData,
                include: {
                    ministerialExperiences: {
                        orderBy: { order: 'asc' },
                    },
                    characterReferences: {
                        orderBy: { order: 'asc' },
                    },
                    preferredBranches: {
                        select: { id: true, title: true },
                    },
                    signature: true,
                    user: {
                        select: userSelect,
                    },
                },
            });
        }));
        winston_1.logger.info('Member updated by admin', {
            memberId,
            adminUserId: req.userId,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Member updated successfully',
            data: updatedMember,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating member by admin', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateMemberByAdmin = updateMemberByAdmin;
