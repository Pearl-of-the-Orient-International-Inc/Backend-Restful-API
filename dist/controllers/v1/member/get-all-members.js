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
exports.getAllMembers = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const getAllMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const all = req.query.all === 'true';
        const page = all ? 1 : parseInt(req.query.page) || 1;
        const limit = all ? undefined : parseInt(req.query.limit) || 10;
        const search = req.query.search || undefined;
        const status = req.query.status;
        const includeArchived = req.query.includeArchived === 'true';
        const skip = limit ? (page - 1) * limit : undefined;
        const where = Object.assign(Object.assign(Object.assign({}, (status ? { status } : {})), (includeArchived ? {} : { isActive: true })), (search
            ? {
                OR: [
                    {
                        firstName: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        lastName: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        user: {
                            email: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                ],
            }
            : {}));
        const totalCount = yield prisma_1.prisma.member.count({ where });
        const members = yield prisma_1.prisma.member.findMany(Object.assign(Object.assign(Object.assign({ where }, (skip !== undefined ? { skip } : {})), (limit !== undefined ? { take: limit } : {})), { orderBy: { createdAt: 'desc' }, include: {
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
            } }));
        const totalPages = limit ? Math.ceil(totalCount / limit) : 1;
        winston_1.logger.info('Members retrieved', {
            count: members.length,
            totalCount,
            page,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Members retrieved successfully',
            data: members,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit: limit !== null && limit !== void 0 ? limit : totalCount,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting members', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getAllMembers = getAllMembers;
