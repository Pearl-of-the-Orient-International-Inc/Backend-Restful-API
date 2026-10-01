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
exports.getUserActivityLogs = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const activity_log_shared_1 = require("./activity-log-shared");
const getUserActivityLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        const limit = parseInt(req.query.limit, 10) || 200;
        if (!userId || Array.isArray(userId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid user ID',
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                id: userId,
                role: enums_1.UserType.ADMIN,
            },
            select: {
                id: true,
            },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Admin account not found',
            });
            return;
        }
        const logs = yield prisma_1.prisma.activityLog.findMany({
            where: {
                userId,
            },
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'User activity logs retrieved successfully',
            data: logs.map(activity_log_shared_1.serializeActivityLog),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while getting user activity logs', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getUserActivityLogs = getUserActivityLogs;
