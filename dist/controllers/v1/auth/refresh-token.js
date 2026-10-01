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
exports.refreshToken = void 0;
const http_codes_1 = require("@/common/http-codes");
const jwt_1 = require("@/lib/jwt");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const jsonwebtoken_1 = require("jsonwebtoken");
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Missing refresh token',
            });
            return;
        }
        const jwtPayload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        if (!jwtPayload) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Invalid refresh token',
            });
            return;
        }
        const tokenExist = yield prisma_1.prisma.userToken.findFirst({
            where: {
                refreshToken,
                userId: jwtPayload.userId,
                sessionId: jwtPayload.sessionId,
            },
        });
        if (!tokenExist) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Invalid refresh token',
            });
            return;
        }
        const accessToken = (0, jwt_1.generateAccessToken)(jwtPayload.userId);
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            accessToken,
        });
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.TokenExpiredError) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Refresh token expired. Please login again',
            });
            return;
        }
        if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Invalid refresh token',
            });
            return;
        }
        winston_1.logger.error('Error during refresh token', { error: err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.refreshToken = refreshToken;
