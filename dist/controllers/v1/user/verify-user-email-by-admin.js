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
exports.verifyUserEmailByAdmin = void 0;
const http_codes_1 = require("../../../common/http-codes");
const enums_1 = require("../../../generated/prisma/enums");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const user_admin_guards_1 = require("./user-admin-guards");
const verifyUserEmailByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const canAccess = yield (0, user_admin_guards_1.ensureItAdmin)(req.userId, res);
        if (!canAccess)
            return;
        const userId = req.params.userId;
        if (!userId || Array.isArray(userId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid user ID',
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId, role: enums_1.UserType.ADMIN },
            select: {
                id: true,
                email: true,
                isEmailVerified: true,
            },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Admin account not found',
            });
            return;
        }
        if (!user.isEmailVerified) {
            yield prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: true },
            });
            winston_1.logger.info('Admin account email verified by IT admin', {
                userId: user.id,
                email: user.email,
                adminUserId: req.userId,
            });
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: user.isEmailVerified
                ? 'Email address is already verified'
                : 'Email address verified successfully',
        });
    }
    catch (err) {
        winston_1.logger.error('Error while verifying account email by admin', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.verifyUserEmailByAdmin = verifyUserEmailByAdmin;
