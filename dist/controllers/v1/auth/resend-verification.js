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
exports.resendVerification = void 0;
const winston_1 = require("../../../lib/winston");
const helpers_1 = require("../../../lib/helpers");
const prisma_1 = require("../../../lib/prisma");
const jwt_1 = require("../../../lib/jwt");
const http_codes_1 = require("../../../common/http-codes");
const config_1 = __importDefault(require("../../../config"));
const verification_redirect_1 = require("../../../lib/verification-redirect");
const mailers_1 = require("../../../mailers");
const verify_email_1 = require("../../../mailers/templates/verify-email");
const enums_1 = require("../../../generated/prisma/enums");
const resendVerification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email } = req.body;
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            winston_1.logger.warn('No user found with this email');
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'No user found with this email',
            });
            return;
        }
        if (user.isEmailVerified) {
            winston_1.logger.warn('You already verified your email');
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'You already verified your email',
            });
            return;
        }
        const uniqueCode = (0, helpers_1.generateUniqueCode)();
        const verificationCode = yield prisma_1.prisma.verificationCode.upsert({
            where: {
                userId: user.id,
            },
            update: {
                type: enums_1.VerificationType.EMAIL_VERIFICATION,
                expiresAt: (0, helpers_1.calculateExpirationDate)('36500d'),
                code: uniqueCode,
            },
            create: {
                userId: user.id,
                type: enums_1.VerificationType.EMAIL_VERIFICATION,
                expiresAt: (0, helpers_1.calculateExpirationDate)('36500d'),
                code: uniqueCode,
            },
        });
        const verificationUrl = (0, verification_redirect_1.buildVerificationUrl)(user.role, verificationCode.code);
        const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: user.email }, (0, verify_email_1.verifyEmailTemplate)(verificationUrl, user.name)));
        if (!emailResult.success) {
            winston_1.logger.warn('Verification email failed to send, but user was created', {
                userId: user.id,
                email: user.email,
            });
        }
        const ipAddress = (0, helpers_1.getClientIp)(req);
        const userAgent = (0, helpers_1.parseUserAgent)((_a = req.headers['user-agent']) !== null && _a !== void 0 ? _a : null);
        const now = new Date();
        const existingSession = yield prisma_1.prisma.session.findFirst({
            where: {
                userId: user.id,
                ipAddress: ipAddress !== null && ipAddress !== void 0 ? ipAddress : null,
                userAgent: userAgent !== null && userAgent !== void 0 ? userAgent : null,
                expiredAt: { gt: now },
            },
        });
        let sessionId;
        if (existingSession) {
            yield prisma_1.prisma.session.update({
                where: { id: existingSession.id },
                data: { expiredAt: (0, helpers_1.calculateExpirationDate)('30d') },
            });
            sessionId = existingSession.id;
        }
        else {
            const newSession = yield prisma_1.prisma.session.create({
                data: {
                    userId: user.id,
                    userAgent: userAgent !== null && userAgent !== void 0 ? userAgent : null,
                    ipAddress: ipAddress !== null && ipAddress !== void 0 ? ipAddress : null,
                    expiredAt: (0, helpers_1.calculateExpirationDate)('30d'),
                },
            });
            sessionId = newSession.id;
        }
        const accessToken = (0, jwt_1.generateAccessToken)(user.id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id, sessionId);
        yield prisma_1.prisma.userToken.upsert({
            where: { userId: user.id, sessionId },
            update: {
                refreshToken,
                expiredAt: (0, helpers_1.calculateExpirationDate)('7d'),
            },
            create: {
                refreshToken,
                sessionId,
                userId: user.id,
                expiredAt: (0, helpers_1.calculateExpirationDate)('7d'),
            },
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config_1.default.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Verification code sent successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                position: user.position,
                accountStatus: user.accountStatus,
                isEmailVerified: user.isEmailVerified,
                isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
            accessToken,
            mfaRequired: false,
        });
    }
    catch (err) {
        winston_1.logger.error('Error during resend verification code', { error: err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.resendVerification = resendVerification;
