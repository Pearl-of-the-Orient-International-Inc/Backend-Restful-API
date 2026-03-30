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
exports.getPublicMemberProfile = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getPublicMemberProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = req.params.memberId;
        if (!memberId || Array.isArray(memberId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid member ID',
            });
            return;
        }
        const member = yield prisma_1.prisma.member.findFirst({
            where: {
                uniqueId: memberId,
            },
            select: {
                id: true,
                uniqueId: true,
                badgeNumber: true,
                status: true,
                memberType: true,
                isActive: true,
                firstName: true,
                middleInitial: true,
                lastName: true,
                extensionName: true,
                churchAffiliation: true,
                currentPositionRole: true,
                currentPositionRoleOther: true,
                nationality: true,
                region: true,
                province: true,
                municipalityCity: true,
                barangay: true,
                preferredBranchOther: true,
                skillsTalents: true,
                tertiaryCollege: true,
                postGraduateStudies: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        name: true,
                        role: true,
                        accountStatus: true,
                        isEmailVerified: true,
                    },
                },
                preferredBranches: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                officerAssignments: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        department: true,
                        region: true,
                        province: true,
                        cityMunicipality: true,
                        barangay: true,
                        startDate: true,
                        officeTitle: {
                            select: {
                                id: true,
                                name: true,
                                level: true,
                            },
                        },
                    },
                },
                applicantRequirements: {
                    where: { reviewStatus: 'APPROVED' },
                    orderBy: { updatedAt: 'desc' },
                    select: {
                        id: true,
                        type: true,
                        fileUrl: true,
                        fileName: true,
                        mimeType: true,
                        updatedAt: true,
                    },
                },
                onboardingProgress: {
                    select: {
                        currentStep: true,
                        preOrientationCompletedAt: true,
                    },
                },
                idGenerationAsset: {
                    select: {
                        profileUrl: true,
                        qrCodeUrl: true,
                        certificateUrl: true,
                        generatedAt: true,
                    },
                },
                chaplaincyTrainingProgress: {
                    select: {
                        completedAt: true,
                    },
                },
            },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member profile not found',
            });
            return;
        }
        winston_1.logger.info('Public member profile retrieved', {
            memberId,
            uniqueId: member.uniqueId,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public member profile retrieved successfully',
            data: member,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting public member profile', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicMemberProfile = getPublicMemberProfile;
