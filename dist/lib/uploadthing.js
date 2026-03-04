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
exports.createUploadthingExpressHandler = exports.uploadRouter = exports.createUploadRouter = void 0;
const express_1 = require("uploadthing/express");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const f = (0, express_1.createUploadthing)();
const defaultUploadLimits = {
    maxFileSize: '4MB',
    maxFileCount: 1,
};
const sanitizeMaxFileCount = (value) => {
    if (!value || !Number.isFinite(value))
        return defaultUploadLimits.maxFileCount;
    return Math.min(Math.max(Math.floor(value), 1), 10);
};
const createAvatarUploaderRoute = (options = {}) => {
    var _a;
    const maxFileSize = (_a = options.maxFileSize) !== null && _a !== void 0 ? _a : defaultUploadLimits.maxFileSize;
    const maxFileCount = sanitizeMaxFileCount(options.maxFileCount);
    return f({
        image: {
            maxFileSize,
            maxFileCount,
        },
    })
        .middleware((_a) => __awaiter(void 0, [_a], void 0, function* ({ req }) {
        const authHeader = req.headers.authorization;
        const bearerToken = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))
            ? authHeader.slice('Bearer '.length).trim()
            : undefined;
        if (!bearerToken) {
            throw new Error('Unauthorized upload attempt');
        }
        const decoded = (0, jwt_1.verifyAccessToken)(bearerToken);
        const userId = decoded === null || decoded === void 0 ? void 0 : decoded.userId;
        if (!userId) {
            throw new Error('Invalid or expired access token');
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return { userId };
    }))
        .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) {
        yield prisma_1.prisma.user.update({
            where: { id: metadata.userId },
            data: {
                avatar: file.ufsUrl,
            },
        });
        return {
            userId: metadata.userId,
            avatarUrl: file.ufsUrl,
        };
    }));
};
const createUploadRouter = (options = {}) => ({
    avatarUploader: createAvatarUploaderRoute(options),
});
exports.createUploadRouter = createUploadRouter;
exports.uploadRouter = (0, exports.createUploadRouter)();
const createUploadthingExpressHandler = (options = {}) => (0, express_1.createRouteHandler)({ router: (0, exports.createUploadRouter)(options) });
exports.createUploadthingExpressHandler = createUploadthingExpressHandler;
