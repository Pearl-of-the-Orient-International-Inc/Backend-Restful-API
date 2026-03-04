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
exports.register = void 0;
const http_codes_1 = require("../../../common/http-codes");
const jwt_1 = require("../../../lib/jwt");
const password_hash_1 = require("../../../lib/password-hash");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const helpers_1 = require("../../../lib/helpers");
const config_1 = __importDefault(require("../../../config"));
const mailers_1 = require("../../../mailers");
const verify_email_1 = require("../../../mailers/templates/verify-email");
const enums_1 = require("../../../generated/prisma/enums");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, email, password, role } = req.body;
    const hashedPassword = yield (0, password_hash_1.hashValue)(password);
    try {
        const existingUser = yield prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (existingUser) {
            winston_1.logger.warn('An account with this email already exists');
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'An account with this email already exists',
            });
            return;
        }
        const user = yield prisma_1.prisma.user.create({
            data: {
                name: name,
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                role,
            },
        });
        const uniqueCode = (0, helpers_1.generateUniqueCode)();
        const verificationCode = yield prisma_1.prisma.verificationCode.create({
            data: {
                userId: user.id,
                type: enums_1.VerificationType.EMAIL_VERIFICATION,
                expiresAt: (0, helpers_1.calculateExpirationDate)('1h'),
                code: uniqueCode,
            },
        });
        const baseUrl = config_1.default.APP_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/confirm-account?token=${verificationCode.code}`;
        const emailResult = yield (0, mailers_1.sendMail)(Object.assign({ sendTo: user.email }, (0, verify_email_1.verifyEmailTemplate)(verificationUrl, user.name)));
        if (!emailResult.success) {
            winston_1.logger.warn('Verification email failed to send, but user was created', {
                userId: user.id,
                email: user.email,
            });
        }
        const ipAddress = (0, helpers_1.getClientIp)(req);
        const userAgent = (0, helpers_1.parseUserAgent)((_a = req.headers['user-agent']) !== null && _a !== void 0 ? _a : null);
        const newSession = yield prisma_1.prisma.session.create({
            data: {
                userId: user.id,
                userAgent: userAgent !== null && userAgent !== void 0 ? userAgent : null,
                ipAddress: ipAddress !== null && ipAddress !== void 0 ? ipAddress : null,
                expiredAt: (0, helpers_1.calculateExpirationDate)('30d'),
            },
        });
        const accessToken = (0, jwt_1.generateAccessToken)(user.id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id, newSession.id);
        yield prisma_1.prisma.userToken.create({
            data: {
                refreshToken,
                userId: user.id,
                sessionId: newSession.id,
                expiredAt: (0, helpers_1.calculateExpirationDate)(config_1.default.JWT_REFRESH_EXPIRES_IN || '7d'),
            },
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config_1.default.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        winston_1.logger.info('User registered successfully', {
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'User registered successfully. Please check your email to verify your account.',
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
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during user registration', err);
    }
});
exports.register = register;
