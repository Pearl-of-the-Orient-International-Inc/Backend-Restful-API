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
exports.changePassword = void 0;
const http_codes_1 = require("@/common/http-codes");
const password_hash_1 = require("@/lib/password-hash");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { oldPassword, password } = req.body;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                password: true,
            },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'User not found',
            });
            return;
        }
        const isPasswordValid = yield (0, password_hash_1.compareValue)(oldPassword, user.password);
        if (!isPasswordValid) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Current password is incorrect',
            });
            return;
        }
        const hashedPassword = yield (0, password_hash_1.hashValue)(password);
        yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
            },
        });
        res.sendStatus(http_codes_1.HTTPSTATUS.NO_CONTENT);
    }
    catch (err) {
        winston_1.logger.error('Error while changing password', err);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.changePassword = changePassword;
