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
exports.getPublicMemberSearch = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getPublicMemberSearch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.trim();
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 8, 1), 20);
        if (!search || search.length < 2) {
            res.status(http_codes_1.HTTPSTATUS.OK).json({
                code: 'OK',
                message: 'Public member search retrieved successfully',
                data: [],
            });
            return;
        }
        const members = yield prisma_1.prisma.member.findMany({
            where: {
                isActive: true,
                status: enums_1.MemberStatus.APPROVED,
                uniqueId: { not: null },
                OR: [
                    { uniqueId: { contains: search, mode: 'insensitive' } },
                    { badgeNumber: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { middleInitial: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { extensionName: { contains: search, mode: 'insensitive' } },
                    { municipalityCity: { contains: search, mode: 'insensitive' } },
                    { province: { contains: search, mode: 'insensitive' } },
                    { region: { contains: search, mode: 'insensitive' } },
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                    {
                        preferredBranches: {
                            some: { title: { contains: search, mode: 'insensitive' } },
                        },
                    },
                    {
                        officerAssignments: {
                            some: {
                                isActive: true,
                                officeTitle: {
                                    name: { contains: search, mode: 'insensitive' },
                                },
                            },
                        },
                    },
                ],
            },
            take: limit,
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            select: {
                id: true,
                uniqueId: true,
                badgeNumber: true,
                memberType: true,
                firstName: true,
                middleInitial: true,
                lastName: true,
                extensionName: true,
                region: true,
                province: true,
                municipalityCity: true,
                user: {
                    select: {
                        name: true,
                        avatar: true,
                        isEmailVerified: true,
                    },
                },
                preferredBranches: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                officerAssignments: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'asc' },
                    take: 1,
                    select: {
                        id: true,
                        officeTitle: {
                            select: {
                                id: true,
                                name: true,
                                level: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public member search retrieved successfully',
            data: members,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while searching public members', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicMemberSearch = getPublicMemberSearch;
