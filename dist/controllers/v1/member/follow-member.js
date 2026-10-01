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
exports.followMember = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const member_follow_shared_1 = require("./member-follow-shared");
const followMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const memberId = req.params.memberId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Unauthorized',
            });
            return;
        }
        if (!memberId || Array.isArray(memberId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid member ID',
            });
            return;
        }
        const [targetMember, followerMember] = yield Promise.all([
            (0, member_follow_shared_1.getFollowTargetMember)(memberId),
            (0, member_follow_shared_1.getCurrentFollowerMember)(userId),
        ]);
        if (!targetMember) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Member profile not found',
            });
            return;
        }
        if (!followerMember) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Only logged in members can follow profiles',
            });
            return;
        }
        if (followerMember.id === targetMember.id) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'You cannot follow your own profile',
            });
            return;
        }
        yield prisma_1.prisma.memberFollow.upsert({
            where: {
                userId_memberId: {
                    userId,
                    memberId: targetMember.id,
                },
            },
            update: {},
            create: {
                userId,
                memberId: targetMember.id,
            },
        });
        yield (0, member_follow_shared_1.sendMemberFollowState)({
            res,
            userId,
            memberId: targetMember.id,
            message: 'Member followed successfully',
        });
    }
    catch (err) {
        winston_1.logger.error('Error while following member', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.followMember = followMember;
