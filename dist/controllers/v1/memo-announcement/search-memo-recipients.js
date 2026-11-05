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
exports.searchMemoRecipients = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const fullName = (member) => [
    member.firstName,
    member.middleInitial ? `${member.middleInitial.replace(/\.$/, '')}.` : null,
    member.lastName,
    member.extensionName,
]
    .filter(Boolean)
    .join(' ') || member.user.name;
const searchMemoRecipients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.trim();
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
        const members = yield prisma_1.prisma.member.findMany({
            where: Object.assign({ isActive: true, status: client_1.MemberStatus.APPROVED }, (search
                ? {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { user: { name: { contains: search, mode: 'insensitive' } } },
                        { user: { email: { contains: search, mode: 'insensitive' } } },
                    ],
                }
                : {})),
            select: {
                id: true,
                firstName: true,
                middleInitial: true,
                lastName: true,
                extensionName: true,
                memberType: true,
                status: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            take: limit,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Memo recipients retrieved successfully',
            data: [
                ...members.map((member) => ({
                    id: member.id,
                    type: 'MEMBER',
                    name: fullName(member),
                    email: member.user.email,
                    avatar: member.user.avatar,
                    label: 'Member',
                    meta: `${member.memberType} / ${member.status}`,
                })),
            ],
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during memo recipient search', err);
    }
});
exports.searchMemoRecipients = searchMemoRecipients;
