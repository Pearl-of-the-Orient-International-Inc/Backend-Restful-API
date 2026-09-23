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
exports.getPublicServiceChaplains = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const getPublicServiceChaplains = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const members = yield prisma_1.prisma.member.findMany({
            where: {
                isActive: true,
                status: enums_1.MemberStatus.APPROVED,
                memberType: enums_1.MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR,
            },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            select: {
                id: true,
                uniqueId: true,
                badgeNumber: true,
                memberType: true,
                firstName: true,
                middleInitial: true,
                lastName: true,
                extensionName: true,
                region: true,
                province: true,
                municipalityCity: true,
                barangay: true,
                preferredBranchOther: true,
                serviceLicenseUrl: true,
                serviceLicenseFileName: true,
                serviceLicenseMimeType: true,
                createdAt: true,
                user: {
                    select: {
                        name: true,
                        avatar: true,
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
                    where: { type: 'PHOTO_2X2' },
                    take: 1,
                    select: {
                        fileUrl: true,
                    },
                },
            },
        });
        winston_1.logger.info('Public service chaplains retrieved', {
            count: members.length,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public service chaplains retrieved successfully',
            data: members,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting public service chaplains', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicServiceChaplains = getPublicServiceChaplains;
