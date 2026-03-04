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
exports.login = void 0;
const http_codes_1 = require("../../../common/http-codes");
const jwt_1 = require("../../../lib/jwt");
const password_hash_1 = require("../../../lib/password-hash");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const helpers_1 = require("../../../lib/helpers");
const config_1 = __importDefault(require("../../../config"));
const mailers_1 = require("../../../mailers");
const login_notification_1 = require("../../../mailers/templates/login-notification");
const enums_1 = require("../../../generated/prisma/enums");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, userAgent } = req.body;
    const ipAddress = (0, helpers_1.getClientIp)(req);
    const headerUserAgent = req.headers['user-agent'];
    const userAgentString = Array.isArray(headerUserAgent)
        ? headerUserAgent[0]
        : headerUserAgent;
    const finalUserAgent = (0, helpers_1.parseUserAgent)(userAgent || userAgentString || null);
    try {
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
        const isPasswordValid = yield (0, password_hash_1.compareValue)(password, user.password);
        if (!isPasswordValid) {
            winston_1.logger.warn('Invalid password attempt', { userId: user.id });
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Invalid password',
            });
            return;
        }
        if (!user.isEmailVerified) {
            winston_1.logger.warn('Login attempt with unverified email', {
                userId: user.id,
                email: user.email,
            });
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
                requiresVerification: true,
            });
            return;
        }
        if (user.role === enums_1.UserType.MEMBER) {
            winston_1.logger.warn('Forbidden member login attempt', {
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'This account is not allowed to access the admin portal.',
            });
            return;
        }
        if (user.isTwoFactorEnabled) {
            if (!user.twoFactorSecret) {
                winston_1.logger.warn('User has 2FA enabled but no secret is configured', {
                    userId: user.id,
                    email: user.email,
                });
                res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                    code: 'FORBIDDEN',
                    message: 'Two-factor authentication is not configured correctly.',
                });
                return;
            }
            const mfaToken = (0, jwt_1.generateMfaToken)(user.id);
            res.status(http_codes_1.HTTPSTATUS.OK).json({
                code: 'OK',
                message: 'Two-factor authentication required',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    isTwoFactorEnabled: user.isTwoFactorEnabled,
                },
                mfaRequired: true,
                mfaToken,
            });
            return;
        }
        const now = new Date();
        const existingSession = yield prisma_1.prisma.session.findFirst({
            where: {
                userId: user.id,
                ipAddress: ipAddress !== null && ipAddress !== void 0 ? ipAddress : null,
                userAgent: finalUserAgent !== null && finalUserAgent !== void 0 ? finalUserAgent : null,
                expiredAt: { gt: now },
            },
        });
        let isNewSession = false;
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
                    userAgent: finalUserAgent !== null && finalUserAgent !== void 0 ? finalUserAgent : null,
                    ipAddress: ipAddress !== null && ipAddress !== void 0 ? ipAddress : null,
                    expiredAt: (0, helpers_1.calculateExpirationDate)('30d'),
                },
            });
            sessionId = newSession.id;
            isNewSession = true;
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
        const timestamp = (0, helpers_1.formatLocalTimestamp)(now);
        const deviceInfo = (0, helpers_1.parseUserAgent)(finalUserAgent);
        const location = yield (0, helpers_1.getLocationFromIP)(ipAddress);
        if (isNewSession) {
            const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: user.email }, (0, login_notification_1.loginNotificationTemplate)(user.name, timestamp, deviceInfo, ipAddress || 'Unknown', location)));
            if (!emailResult.success) {
                winston_1.logger.warn('Login notification email failed to send', {
                    userId: user.id,
                    email: user.email,
                });
            }
            else {
                winston_1.logger.info('Login notification email sent successfully', {
                    userId: user.id,
                    email: user.email,
                });
            }
        }
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config_1.default.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        winston_1.logger.info('User logged in successfully', {
            userId: user.id,
            email: user.email,
            role: user.role,
            ipAddress,
            location,
            device: deviceInfo,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'User logged in successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
            accessToken,
            mfaRequired: false,
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during user login', err);
    }
});
exports.login = login;
