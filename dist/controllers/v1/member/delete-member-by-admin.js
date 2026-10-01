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
exports.deleteMemberByAdmin = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const member_admin_guards_1 = require("./member-admin-guards");
const deleteMemberByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const member = yield prisma_1.prisma.member.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                userId: true,
                firstName: true,
                lastName: true,
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });
        if (!member) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member not found',
            });
            return;
        }
        yield prisma_1.prisma.user.delete({
            where: { id: member.userId },
        });
        winston_1.logger.info('Member deleted by IT admin', {
            memberId,
            deletedUserId: member.userId,
            email: member.user.email,
            adminUserId: req.userId,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Member deleted successfully',
        });
    }
    catch (err) {
        winston_1.logger.error('Error while deleting member by admin', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.deleteMemberByAdmin = deleteMemberByAdmin;
