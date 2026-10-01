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
exports.getCurrentMemberRequirements = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const member_requirements_1 = require("@/lib/member-requirements");
const getCurrentMemberRequirements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Unauthorized',
            });
            return;
        }
        const member = yield prisma_1.prisma.member.findUnique({
            where: { userId },
            select: {
                id: true,
                status: true,
                uniqueId: true,
                applicantRequirements: {
                    select: {
                        type: true,
                        fileUrl: true,
                        fileName: true,
                        mimeType: true,
                        reviewStatus: true,
                        updatedAt: true,
                    },
                    orderBy: { updatedAt: 'desc' },
                },
            },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member application not found',
            });
            return;
        }
        const attachments = member.applicantRequirements.reduce((acc, item) => {
            acc[member_requirements_1.requirementTypeToKey[item.type]] = item.fileUrl;
            return acc;
        }, {});
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Member requirements retrieved successfully',
            data: {
                memberId: member.id,
                status: member.status,
                uniqueId: member.uniqueId,
                attachments,
                requirements: member.applicantRequirements,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting current member requirements', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getCurrentMemberRequirements = getCurrentMemberRequirements;
