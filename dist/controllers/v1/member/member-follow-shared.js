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
exports.sendMemberFollowState = exports.getCurrentFollowerMember = exports.getFollowTargetMember = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const getFollowTargetMember = (memberId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.member.findFirst({
        where: {
            OR: [{ id: memberId }, { uniqueId: memberId }],
        },
        select: {
            id: true,
            uniqueId: true,
            userId: true,
        },
    });
});
exports.getFollowTargetMember = getFollowTargetMember;
const getCurrentFollowerMember = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.member.findUnique({
        where: { userId },
        select: {
            id: true,
            uniqueId: true,
        },
    });
});
exports.getCurrentFollowerMember = getCurrentFollowerMember;
const sendMemberFollowState = (_a) => __awaiter(void 0, [_a], void 0, function* ({ res, userId, memberId, message, }) {
    const [follow, followerCount] = yield Promise.all([
        prisma_1.prisma.memberFollow.findUnique({
            where: {
                userId_memberId: {
                    userId,
                    memberId,
                },
            },
            select: { id: true },
        }),
        prisma_1.prisma.memberFollow.count({
            where: { memberId },
        }),
    ]);
    res.status(http_codes_1.HTTPSTATUS.OK).json({
        code: 'OK',
        message,
        data: {
            isFollowing: Boolean(follow),
            followerCount,
        },
    });
});
exports.sendMemberFollowState = sendMemberFollowState;
