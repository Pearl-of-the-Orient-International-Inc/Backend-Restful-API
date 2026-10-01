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
exports.upsertIdGenerationAsset = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const member_unique_id_1 = require("@/lib/member-unique-id");
const upsertIdGenerationAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                uniqueId: true,
                user: {
                    select: {
                        role: true,
                    },
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
        let nextUniqueId = member.uniqueId;
        if (!nextUniqueId) {
            nextUniqueId = yield (0, member_unique_id_1.generateNextMemberUniqueId)(member.user.role);
        }
        const [updatedMember, asset] = yield prisma_1.prisma.$transaction([
            prisma_1.prisma.member.update({
                where: { id: member.id },
                data: { uniqueId: nextUniqueId },
                select: { uniqueId: true },
            }),
            prisma_1.prisma.memberIdGenerationAsset.upsert({
                where: { memberId: member.id },
                create: {
                    memberId: member.id,
                    profileUrl: body.profileUrl,
                    qrCodeUrl: body.qrCodeUrl,
                    generatedAt: new Date(),
                },
                update: {
                    profileUrl: body.profileUrl,
                    qrCodeUrl: body.qrCodeUrl,
                    generatedAt: new Date(),
                },
                select: {
                    profileUrl: true,
                    qrCodeUrl: true,
                    generatedAt: true,
                },
            }),
        ]);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'ID generation asset saved successfully',
            data: {
                uniqueId: updatedMember.uniqueId,
                asset,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while saving ID generation asset', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.upsertIdGenerationAsset = upsertIdGenerationAsset;
