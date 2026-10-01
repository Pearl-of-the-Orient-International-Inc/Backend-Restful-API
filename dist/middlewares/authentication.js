"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const http_codes_1 = require("@/common/http-codes");
const jwt_1 = require("@/lib/jwt");
const winston_1 = require("@/lib/winston");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
        winston_1.logger.error('Access denied, no token provided');
        res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
            code: 'UNAUTHORIZED',
            message: 'Access denied, no token provided',
        });
        return;
    }
    const [_, token] = authHeader.split(' ');
    try {
        const jwtPayload = (0, jwt_1.verifyAccessToken)(token);
        req.userId = jwtPayload.userId;
        return next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.TokenExpiredError) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Access token expired, request a new one with refresh token',
            });
            return;
        }
        if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
            res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
                code: 'UNAUTHORIZED',
                message: 'Invalid access token',
            });
            return;
        }
        winston_1.logger.error('Error during authentication', { error: err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
        next();
        return;
    }
    const token = authHeader.slice('Bearer '.length).trim();
    try {
        const jwtPayload = (0, jwt_1.verifyAccessToken)(token);
        req.userId = jwtPayload.userId;
        next();
    }
    catch (err) {
        winston_1.logger.warn('Invalid optional authentication token', { error: err });
        res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired access token',
        });
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
