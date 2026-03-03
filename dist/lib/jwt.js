"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const generateAccessToken = (userId) => {
    const token = jsonwebtoken_1.default.sign({ userId }, config_1.default.JWT_ACCESS_SECRET, {
        expiresIn: config_1.default.JWT_ACCESS_EXPIRES_IN,
    });
    return token;
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId, sessionId) => {
    const token = jsonwebtoken_1.default.sign({ userId, sessionId }, config_1.default.JWT_REFRESH_SECRET, {
        expiresIn: config_1.default.JWT_REFRESH_EXPIRES_IN,
    });
    return token;
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.default.JWT_ACCESS_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.JWT_REFRESH_SECRET);
        if ((decoded === null || decoded === void 0 ? void 0 : decoded.userId) && (decoded === null || decoded === void 0 ? void 0 : decoded.sessionId)) {
            return { userId: decoded.userId, sessionId: decoded.sessionId };
        }
        return null;
    }
    catch (_a) {
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
