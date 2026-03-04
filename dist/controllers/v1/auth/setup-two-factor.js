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
exports.setupTwoFactor = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const setupTwoFactor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'User not found',
            });
            return;
        }
        const generated = speakeasy_1.default.generateSecret({
            name: user.email,
            issuer: 'Pearl of the Orient 2FA',
            length: 20,
        });
        if (!generated.base32 || !generated.otpauth_url) {
            res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Unable to initialize two-factor setup',
            });
            return;
        }
        const qrCodeDataUrl = yield qrcode_1.default.toDataURL(generated.otpauth_url);
        yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: generated.base32,
                isTwoFactorEnabled: false,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Two-factor authentication setup initialized',
            data: {
                secret: generated.base32,
                otpauthUrl: generated.otpauth_url,
                qrCodeDataUrl,
            },
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during two-factor setup', err);
    }
});
exports.setupTwoFactor = setupTwoFactor;
