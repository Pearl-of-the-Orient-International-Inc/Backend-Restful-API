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
exports.updateUserById = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const updateUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.params.userId;
        const payload = req.body;
        if (!userId || Array.isArray(userId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid user ID',
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId, role: enums_1.UserType.ADMIN },
            select: { id: true, email: true },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Admin account not found',
            });
            return;
        }
        if (payload.email && payload.email !== user.email) {
            const existingUser = yield prisma_1.prisma.user.findUnique({
                where: { email: payload.email.trim().toLowerCase() },
                select: { id: true },
            });
            if (existingUser && existingUser.id !== userId) {
                res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                    code: 'CONFLICT',
                    message: 'Email address is already in use',
                });
                return;
            }
        }
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                name: payload.name,
                email: (_a = payload.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase(),
                role: (_b = payload.role) !== null && _b !== void 0 ? _b : enums_1.UserType.ADMIN,
                position: payload.position,
                accountStatus: payload.accountStatus,
                avatar: payload.avatar === '' ? null : payload.avatar,
                isTwoFactorEnabled: payload.isTwoFactorEnabled,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                position: true,
                accountStatus: true,
                isEmailVerified: true,
                isTwoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Account updated successfully',
            user: updatedUser,
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating user account', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateUserById = updateUserById;
