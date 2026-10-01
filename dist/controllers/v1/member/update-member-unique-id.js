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
exports.updateMemberUniqueId = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const member_admin_guards_1 = require("./member-admin-guards");
const isUniqueIdConflict = (error) => {
    var _a;
    if (!error || typeof error !== 'object' || !('code' in error)) {
        return false;
    }
    const prismaError = error;
    const target = (_a = prismaError.meta) === null || _a === void 0 ? void 0 : _a.target;
    const normalizedTarget = Array.isArray(target)
        ? target.join(',').toLowerCase()
        : String(target !== null && target !== void 0 ? target : '').toLowerCase();
    return prismaError.code === 'P2002' && normalizedTarget.includes('uniqueid');
};
const updateMemberUniqueId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = req.params.id;
        if (!memberId || Array.isArray(memberId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid member ID',
            });
            return;
        }
        if (!(yield (0, member_admin_guards_1.ensureItAdmin)(req.userId, res))) {
            return;
        }
        const { uniqueId } = req.body;
        const normalizedUniqueId = uniqueId.trim();
        const existingMember = yield prisma_1.prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true, uniqueId: true },
        });
        if (!existingMember) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member not found',
            });
            return;
        }
        if (existingMember.uniqueId === normalizedUniqueId) {
            res.status(http_codes_1.HTTPSTATUS.OK).json({
                code: 'OK',
                message: 'Member ID is unchanged',
                data: existingMember,
            });
            return;
        }
        const duplicateMember = yield prisma_1.prisma.member.findFirst({
            where: {
                uniqueId: normalizedUniqueId,
                id: { not: memberId },
            },
            select: { id: true },
        });
        if (duplicateMember) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Member ID already exists',
            });
            return;
        }
        const updatedMember = yield prisma_1.prisma.member.update({
            where: { id: memberId },
            data: { uniqueId: normalizedUniqueId },
            include: {
                ministerialExperiences: { orderBy: { order: 'asc' } },
                characterReferences: { orderBy: { order: 'asc' } },
                preferredBranches: { select: { id: true, title: true } },
                signature: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        role: true,
                        isEmailVerified: true,
                    },
                },
            },
        });
        winston_1.logger.info('Member unique ID updated by IT admin', {
            memberId,
            uniqueId: normalizedUniqueId,
            adminUserId: req.userId,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Member ID updated successfully',
            data: updatedMember,
        });
    }
    catch (err) {
        if (isUniqueIdConflict(err)) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'Member ID already exists',
            });
            return;
        }
        winston_1.logger.error('Error while updating member unique ID', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateMemberUniqueId = updateMemberUniqueId;
