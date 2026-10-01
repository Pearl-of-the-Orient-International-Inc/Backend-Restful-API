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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableTwoFactor = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const enableTwoFactor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { token } = req.body;
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
                twoFactorSecret: true,
            },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'User not found',
            });
            return;
        }
        if (!user.twoFactorSecret) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Two-factor setup not initialized. Please configure first.',
            });
            return;
        }
        const isValidToken = speakeasy_1.default.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 1,
        });
        if (!isValidToken) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid authentication code',
            });
            return;
        }
        yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: true },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Two-factor authentication enabled successfully',
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error while enabling two-factor authentication', err);
    }
});
exports.enableTwoFactor = enableTwoFactor;
