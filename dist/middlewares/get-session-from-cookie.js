"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionFromCookie = void 0;
const jwt_1 = require("@/lib/jwt");
const getSessionFromCookie = (req, _res, next) => {
    var _a;
    try {
        const refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        console.log('🔍 Checking for refresh token:', {
            hasCookie: !!refreshToken,
            cookies: Object.keys(req.cookies || {}),
        });
        if (!refreshToken) {
            console.log('⚠️ No refresh token found in cookies');
            return next();
        }
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        console.log('🔓 Token payload:', payload);
        if (payload === null || payload === void 0 ? void 0 : payload.sessionId) {
            req.sessionId = payload.sessionId;
            console.log('✅ Session ID set:', req.sessionId);
        }
        else {
            console.log('⚠️ No sessionId in token payload');
        }
        next();
    }
    catch (error) {
        console.error('❌ Error verifying refresh token:', error);
        next();
    }
};
exports.getSessionFromCookie = getSessionFromCookie;
