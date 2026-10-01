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
exports.updateMemberStatus = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const member_unique_id_1 = require("@/lib/member-unique-id");
const enums_1 = require("@/generated/prisma/enums");
const client_1 = require("@/generated/prisma/client");
const updateMemberStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberId = req.params.id;
        if (!memberId || Array.isArray(memberId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid member ID',
            });
            return;
        }
        const { status } = req.body;
        const existingMember = yield prisma_1.prisma.member.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                status: true,
                isActive: true,
                uniqueId: true,
                user: {
                    select: {
                        role: true,
                    },
                },
            },
        });
        if (!existingMember) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member not found',
            });
            return;
        }
        const updatedMember = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            let nextUniqueId = existingMember.uniqueId;
            if (status === enums_1.MemberStatus.APPROVED && !existingMember.uniqueId) {
                nextUniqueId = yield (0, member_unique_id_1.generateNextMemberUniqueId)(existingMember.user.role, tx);
            }
            return tx.member.update({
                where: { id: memberId },
                data: {
                    status,
                    uniqueId: nextUniqueId,
                    user: {
                        update: status === enums_1.MemberStatus.APPROVED
                            ? { accountStatus: enums_1.UserAccountStatus.ACTIVE }
                            : {},
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            accountStatus: true,
                        },
                    },
                },
            });
        }), {
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
        });
        winston_1.logger.info('Member status updated', {
            memberId,
            from: existingMember.status,
            to: status,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Member status updated successfully',
            data: updatedMember,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating member status', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateMemberStatus = updateMemberStatus;
