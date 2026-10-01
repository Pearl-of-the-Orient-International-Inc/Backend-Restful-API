"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateOwnerAccess = exports.clearOwnerSessionCookie = exports.setOwnerSessionCookie = exports.verifyOwnerSessionToken = exports.createOwnerSessionToken = exports.getOwnerSessionCookieOptions = exports.getOwnerSessionCookieName = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_codes_1 = require("@/common/http-codes");
const config_1 = __importDefault(require("@/config"));
const OWNER_SESSION_TTL_MS = 10 * 60 * 1000;
const getOwnerSessionCookieName = () => config_1.default.OWNER_SESSION_COOKIE_NAME;
exports.getOwnerSessionCookieName = getOwnerSessionCookieName;
const getOwnerSessionCookieOptions = () => ({
    httpOnly: true,
    secure: config_1.default.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: OWNER_SESSION_TTL_MS,
    path: '/api/v1/owner',
});
exports.getOwnerSessionCookieOptions = getOwnerSessionCookieOptions;
const createOwnerSessionToken = () => jsonwebtoken_1.default.sign({ ownerAccess: true }, config_1.default.JWT_ACCESS_SECRET, {
    expiresIn: '10m',
});
exports.createOwnerSessionToken = createOwnerSessionToken;
const verifyOwnerSessionToken = (token) => {
    if (!token)
        return null;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.JWT_ACCESS_SECRET);
        return decoded.ownerAccess === true ? decoded : null;
    }
    catch (_a) {
        return null;
    }
};
exports.verifyOwnerSessionToken = verifyOwnerSessionToken;
const setOwnerSessionCookie = (res) => {
    res.cookie((0, exports.getOwnerSessionCookieName)(), (0, exports.createOwnerSessionToken)(), (0, exports.getOwnerSessionCookieOptions)());
};
exports.setOwnerSessionCookie = setOwnerSessionCookie;
const clearOwnerSessionCookie = (res) => {
    res.clearCookie((0, exports.getOwnerSessionCookieName)(), Object.assign(Object.assign({}, (0, exports.getOwnerSessionCookieOptions)()), { maxAge: undefined }));
};
exports.clearOwnerSessionCookie = clearOwnerSessionCookie;
const authenticateOwnerAccess = (req, res, next) => {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[(0, exports.getOwnerSessionCookieName)()];
    const payload = (0, exports.verifyOwnerSessionToken)(token);
    if (!payload) {
        res.status(http_codes_1.HTTPSTATUS.UNAUTHORIZED).json({
            code: 'UNAUTHORIZED',
            message: 'Owner PIN session expired. Enter PIN again.',
        });
        return;
    }
    next();
};
exports.authenticateOwnerAccess = authenticateOwnerAccess;
