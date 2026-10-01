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
exports.verifyPasskeyAuthentication = exports.getPasskeyAuthenticationOptions = exports.verifyPasskeyRegistration = exports.getPasskeyRegistrationOptions = exports.getPasskeyStatus = void 0;
const server_1 = require("@simplewebauthn/server");
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const helpers_1 = require("@/lib/helpers");
const jwt_1 = require("@/lib/jwt");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const config_1 = __importDefault(require("@/config"));
const mailers_1 = require("@/mailers");
const login_notification_1 = require("@/mailers/templates/login-notification");
const client_1 = require("@/generated/prisma/client");
const activity_log_1 = require("@/lib/activity-log");
const normalizeOrigin = (origin) => origin.replace(/\/+$/, '');
const getRpID = () => {
    if (config_1.default.PASSKEY_RP_ID) {
        return config_1.default.PASSKEY_RP_ID;
    }
    try {
        const fromAppUrl = new URL(config_1.default.APP_URL).hostname;
        if (fromAppUrl)
            return fromAppUrl;
    }
    catch (_a) {
    }
    return 'localhost';
};
const getExpectedOrigins = () => {
    const origins = new Set();
    const addOrigin = (origin) => {
        if (!origin)
            return;
        origins.add(normalizeOrigin(origin));
    };
    addOrigin(config_1.default.APP_URL);
    for (const origin of config_1.default.WHITELIST_ORIGINS)
        addOrigin(origin);
    for (const origin of config_1.default.PASSKEY_EXPECTED_ORIGINS)
        addOrigin(origin);
    addOrigin('http://localhost:3000');
    return [...origins];
};
const getPasskeyStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        const count = yield prisma_1.prisma.passkeyCredential.count({
            where: { userId },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Passkey status retrieved successfully',
            data: {
                hasPasskey: count > 0,
                count,
            },
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error while retrieving passkey status', err);
    }
});
exports.getPasskeyStatus = getPasskeyStatus;
const getPasskeyRegistrationOptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { label } = req.body;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                passkeyCredentials: true,
            },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'User not found',
            });
            return;
        }
        const options = yield (0, server_1.generateRegistrationOptions)({
            rpName: config_1.default.PASSKEY_RP_NAME,
            rpID: getRpID(),
            userName: user.email,
            userDisplayName: user.name,
            userID: new TextEncoder().encode(user.id),
            attestationType: 'none',
            timeout: 60000,
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
            },
            excludeCredentials: user.passkeyCredentials.map((credential) => ({
                id: credential.credentialID,
                transports: credential.transports,
            })),
        });
        yield prisma_1.prisma.passkeyChallenge.upsert({
            where: { userId: user.id },
            update: {
                type: enums_1.PasskeyChallengeType.REGISTRATION,
                challenge: options.challenge,
                expiresAt: (0, helpers_1.calculateExpirationDate)('10m'),
            },
            create: {
                userId: user.id,
                type: enums_1.PasskeyChallengeType.REGISTRATION,
                challenge: options.challenge,
                expiresAt: (0, helpers_1.calculateExpirationDate)('10m'),
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Passkey registration options generated successfully',
            data: {
                options,
                label: label !== null && label !== void 0 ? label : null,
            },
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error while generating passkey registration options', err);
    }
});
exports.getPasskeyRegistrationOptions = getPasskeyRegistrationOptions;
const verifyPasskeyRegistration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.userId;
        const { response } = req.body;
        if (!userId) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            });
            return;
        }
        const [user, challengeRow] = yield Promise.all([
            prisma_1.prisma.user.findUnique({
                where: { id: userId },
            }),
            prisma_1.prisma.passkeyChallenge.findUnique({
                where: { userId },
            }),
        ]);
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'User not found',
            });
            return;
        }
        if (!challengeRow ||
            challengeRow.type !== enums_1.PasskeyChallengeType.REGISTRATION ||
            challengeRow.expiresAt < new Date()) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Passkey registration challenge has expired. Please try again.',
            });
            return;
        }
        const registrationResponse = response;
        const transports = Array.isArray((_a = registrationResponse.response) === null || _a === void 0 ? void 0 : _a.transports)
            ? (_b = registrationResponse
                .response) === null || _b === void 0 ? void 0 : _b.transports
            : [];
        const verification = yield (0, server_1.verifyRegistrationResponse)({
            response: registrationResponse,
            expectedChallenge: challengeRow.challenge,
            expectedOrigin: getExpectedOrigins(),
            expectedRPID: getRpID(),
        });
        if (!verification.verified || !verification.registrationInfo) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Passkey registration verification failed',
            });
            return;
        }
        const { credential, credentialDeviceType, credentialBackedUp, } = verification.registrationInfo;
        yield prisma_1.prisma.passkeyCredential.upsert({
            where: { credentialID: credential.id },
            update: {
                publicKey: Buffer.from(credential.publicKey),
                counter: credential.counter,
                deviceType: credentialDeviceType,
                backedUp: credentialBackedUp,
                transports,
            },
            create: {
                userId: user.id,
                credentialID: credential.id,
                publicKey: Buffer.from(credential.publicKey),
                counter: credential.counter,
                deviceType: credentialDeviceType,
                backedUp: credentialBackedUp,
                transports,
            },
        });
        yield prisma_1.prisma.passkeyChallenge.delete({
            where: { userId: user.id },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Passkey registered successfully',
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Internal server error';
        const isConfigMismatch = /expectedOrigin|origin|expectedRPID|rpid|challenge|webauthn/i.test(errorMessage);
        res.status(isConfigMismatch ? http_codes_1.HTTPSTATUS.BAD_REQUEST : http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: isConfigMismatch ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: isConfigMismatch
                ? `Passkey registration verification failed: ${errorMessage}`
                : 'Internal server error',
        });
        winston_1.logger.error('Error while verifying passkey registration', err);
    }
});
exports.verifyPasskeyRegistration = verifyPasskeyRegistration;
const getPasskeyAuthenticationOptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield prisma_1.prisma.user.findUnique({
            where: { email },
            include: {
                passkeyCredentials: true,
            },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'No user found with this email',
            });
            return;
        }
        if (!user.isEmailVerified) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Please verify your email address before logging in.',
            });
            return;
        }
        if (user.accountStatus !== enums_1.UserAccountStatus.ACTIVE) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Your account is not active. Please contact an administrator.',
            });
            return;
        }
        if (user.role === enums_1.UserType.MEMBER) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'This account is not allowed to access the admin portal.',
            });
            return;
        }
        if (user.passkeyCredentials.length === 0) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'No passkey is configured for this account',
            });
            return;
        }
        const options = yield (0, server_1.generateAuthenticationOptions)({
            rpID: getRpID(),
            timeout: 60000,
            userVerification: 'preferred',
            allowCredentials: user.passkeyCredentials.map((credential) => ({
                id: credential.credentialID,
                transports: credential.transports,
            })),
        });
        yield prisma_1.prisma.passkeyChallenge.upsert({
            where: { userId: user.id },
            update: {
                type: enums_1.PasskeyChallengeType.AUTHENTICATION,
                challenge: options.challenge,
                expiresAt: (0, helpers_1.calculateExpirationDate)('10m'),
            },
            create: {
                userId: user.id,
                type: enums_1.PasskeyChallengeType.AUTHENTICATION,
                challenge: options.challenge,
                expiresAt: (0, helpers_1.calculateExpirationDate)('10m'),
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Passkey authentication options generated successfully',
            data: { options },
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error while generating passkey authentication options', err);
    }
});
exports.getPasskeyAuthenticationOptions = getPasskeyAuthenticationOptions;
const verifyPasskeyAuthentication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, response, userAgent } = req.body;
    const ipAddress = (0, helpers_1.getClientIp)(req);
    const headerUserAgent = req.headers['user-agent'];
    const userAgentString = Array.isArray(headerUserAgent)
        ? headerUserAgent[0]
        : headerUserAgent;
    const finalUserAgent = (0, helpers_1.parseUserAgent)(userAgent || userAgentString || null);
    try {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { email },
            include: {
                passkeyCredentials: true,
                passkeyChallenge: true,
            },
        });
        if (!user) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'No user found with this email',
            });
            return;
        }
        if (user.accountStatus !== enums_1.UserAccountStatus.ACTIVE) {
            res.status(http_codes_1.HTTPSTATUS.FORBIDDEN).json({
                code: 'FORBIDDEN',
                message: 'Your account is not active. Please contact an administrator.',
            });
            return;
        }
        const challengeRow = user.passkeyChallenge;
        if (!challengeRow ||
            challengeRow.type !== enums_1.PasskeyChallengeType.AUTHENTICATION ||
            challengeRow.expiresAt < new Date()) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Passkey authentication challenge has expired. Please try again.',
            });
            return;
        }
        const storedCredential = user.passkeyCredentials.find((credential) => credential.credentialID === response.id);
        if (!storedCredential) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Passkey credential is not recognized for this account',
            });
            return;
        }
        const authenticationResponse = response;
        const verification = yield (0, server_1.verifyAuthenticationResponse)({
            response: authenticationResponse,
            expectedChallenge: challengeRow.challenge,
            expectedOrigin: getExpectedOrigins(),
            expectedRPID: getRpID(),
            credential: {
                id: storedCredential.credentialID,
                publicKey: new Uint8Array(storedCredential.publicKey),
                counter: storedCredential.counter,
                transports: storedCredential.transports,
            },
        });
        if (!verification.verified) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Passkey authentication failed',
            });
            return;
        }
        yield prisma_1.prisma.$transaction([
            prisma_1.prisma.passkeyCredential.update({
                where: { credentialID: storedCredential.credentialID },
                data: {
                    counter: verification.authenticationInfo.newCounter,
                },
            }),
            prisma_1.prisma.passkeyChallenge.delete({
                where: { userId: user.id },
            }),
        ]);
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
        winston_1.logger.info('User logged in successfully with passkey', {
            userId: user.id,
            email: user.email,
            role: user.role,
            ipAddress,
            location,
            device: deviceInfo,
        });
        yield (0, activity_log_1.createActivityLog)({
            userId: user.id,
            actorName: user.name,
            actorEmail: user.email,
            actorAvatar: user.avatar,
            actionType: client_1.ActivityLogActionType.AUTH,
            actionLabel: 'Logged in with passkey',
            moduleLabel: 'Authentication',
            targetLabel: 'Admin portal',
            description: `${user.name} logged in using passkey authentication.`,
            result: client_1.ActivityLogResult.SUCCESS,
            ipAddress: ipAddress !== null && ipAddress !== void 0 ? ipAddress : null,
            deviceLabel: deviceInfo !== null && deviceInfo !== void 0 ? deviceInfo : null,
            metadata: ['Login', 'Passkey authentication'],
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
        const errorMessage = err instanceof Error ? err.message : 'Internal server error';
        const isConfigMismatch = /expectedOrigin|origin|expectedRPID|rpid|challenge|webauthn/i.test(errorMessage);
        res.status(isConfigMismatch ? http_codes_1.HTTPSTATUS.BAD_REQUEST : http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: isConfigMismatch ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
            message: isConfigMismatch
                ? `Passkey authentication failed: ${errorMessage}`
                : 'Internal server error',
        });
        winston_1.logger.error('Error while verifying passkey authentication', err);
    }
});
exports.verifyPasskeyAuthentication = verifyPasskeyAuthentication;
