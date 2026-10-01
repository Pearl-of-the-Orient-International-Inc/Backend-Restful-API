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
exports.logout = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const config_1 = __importDefault(require("@/config"));
const client_1 = require("@/generated/prisma/client");
const activity_log_1 = require("@/lib/activity-log");
const helpers_1 = require("@/lib/helpers");
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const user = req.userId
            ? yield prisma_1.prisma.user.findUnique({
                where: { id: req.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            })
            : null;
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            yield prisma_1.prisma.userToken.delete({
                where: {
                    refreshToken,
                },
            });
            winston_1.logger.info('User refresh token deleted successfully', {
                userId: req.userId,
                token: refreshToken,
            });
        }
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config_1.default.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        winston_1.logger.info('User logged out successfully', {
            userId: req.userId,
        });
        if (user) {
            yield (0, activity_log_1.createActivityLog)({
                userId: user.id,
                actorName: user.name,
                actorEmail: user.email,
                actorAvatar: user.avatar,
                actionType: client_1.ActivityLogActionType.AUTH,
                actionLabel: 'Logged out',
                moduleLabel: 'Authentication',
                targetLabel: 'Admin portal session',
                description: `${user.name} logged out from the admin portal.`,
                result: client_1.ActivityLogResult.SUCCESS,
                ipAddress: (_a = (0, helpers_1.getClientIp)(req)) !== null && _a !== void 0 ? _a : null,
                deviceLabel: (_c = (0, helpers_1.parseUserAgent)((_b = req.headers['user-agent']) !== null && _b !== void 0 ? _b : null)) !== null && _c !== void 0 ? _c : null,
                metadata: ['Logout'],
            });
        }
        res.sendStatus(http_codes_1.HTTPSTATUS.NO_CONTENT);
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during user logout', err);
    }
});
exports.logout = logout;
