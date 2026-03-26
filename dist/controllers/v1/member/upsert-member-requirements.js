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
exports.upsertMemberRequirements = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const enums_1 = require("../../../generated/prisma/enums");
const member_requirements_1 = require("../../../lib/member-requirements");
const upsertMemberRequirements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                applicantRequirements: {
                    select: { type: true },
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
        const body = req.body;
        const dedupedByType = new Map(body.attachments.map((attachment) => [attachment.type, attachment]));
        const typeSet = new Set(member.applicantRequirements.map((item) => item.type));
        for (const type of dedupedByType.keys()) {
            typeSet.add(type);
        }
        if (!typeSet.has(enums_1.ApplicantRequirementType.PHOTO_2X2)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: '2x2 picture is required',
            });
            return;
        }
        const upsertPayload = [...dedupedByType.values()];
        yield prisma_1.prisma.$transaction(upsertPayload.map((attachment) => {
            var _a, _b, _c, _d;
            return prisma_1.prisma.applicantRequirement.upsert({
                where: {
                    memberId_type: {
                        memberId: member.id,
                        type: attachment.type,
                    },
                },
                create: {
                    memberId: member.id,
                    type: attachment.type,
                    fileUrl: attachment.fileUrl,
                    fileName: (_a = attachment.fileName) !== null && _a !== void 0 ? _a : null,
                    mimeType: (_b = attachment.mimeType) !== null && _b !== void 0 ? _b : null,
                },
                update: {
                    fileUrl: attachment.fileUrl,
                    fileName: (_c = attachment.fileName) !== null && _c !== void 0 ? _c : null,
                    mimeType: (_d = attachment.mimeType) !== null && _d !== void 0 ? _d : null,
                },
            });
        }));
        const requirements = yield prisma_1.prisma.applicantRequirement.findMany({
            where: { memberId: member.id },
            select: {
                type: true,
                fileUrl: true,
                fileName: true,
                mimeType: true,
                reviewStatus: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
        const attachments = requirements.reduce((acc, item) => {
            acc[member_requirements_1.requirementTypeToKey[item.type]] = item.fileUrl;
            return acc;
        }, {});
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Member requirements saved successfully',
            data: {
                memberId: member.id,
                attachments,
                requirements,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while saving member requirements', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.upsertMemberRequirements = upsertMemberRequirements;
