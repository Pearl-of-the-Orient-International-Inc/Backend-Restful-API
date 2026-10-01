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
exports.deleteCurrentServiceLicense = exports.updateCurrentServiceLicense = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getEligibleMember = (userId) => {
    if (!userId)
        return null;
    return prisma_1.prisma.member.findFirst({
        where: {
            userId,
            isActive: true,
            status: enums_1.MemberStatus.APPROVED,
            memberType: enums_1.MemberType.CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR,
        },
        select: { id: true },
    });
};
const licenseSelect = {
    id: true,
    uniqueId: true,
    serviceLicenseUrl: true,
    serviceLicenseFileName: true,
    serviceLicenseMimeType: true,
};
const updateCurrentServiceLicense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const member = yield getEligibleMember(req.userId);
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Only approved active Certified Specialist Training Officer Instructors can manage a service license',
            });
            return;
        }
        const license = yield prisma_1.prisma.member.update({
            where: { id: member.id },
            data: {
                serviceLicenseUrl: req.body.fileUrl,
                serviceLicenseFileName: req.body.fileName,
                serviceLicenseMimeType: req.body.mimeType,
            },
            select: licenseSelect,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Service license updated successfully',
            data: license,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating current service license', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateCurrentServiceLicense = updateCurrentServiceLicense;
const deleteCurrentServiceLicense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const member = yield getEligibleMember(req.userId);
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Only approved active Certified Specialist Training Officer Instructors can manage a service license',
            });
            return;
        }
        const license = yield prisma_1.prisma.member.update({
            where: { id: member.id },
            data: {
                serviceLicenseUrl: null,
                serviceLicenseFileName: null,
                serviceLicenseMimeType: null,
            },
            select: licenseSelect,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Service license removed successfully',
            data: license,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while removing current service license', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.deleteCurrentServiceLicense = deleteCurrentServiceLicense;
