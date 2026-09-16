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
exports.utapi = exports.createUploadthingExpressHandler = exports.uploadRouter = exports.createUploadRouter = void 0;
const express_1 = require("uploadthing/express");
const server_1 = require("uploadthing/server");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const enums_1 = require("../generated/prisma/enums");
const f = (0, express_1.createUploadthing)();
const utapi = new server_1.UTApi();
exports.utapi = utapi;
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
const createMemberRequirementUploaderRoute = () => f({
    image: {
        maxFileSize: '8MB',
        maxFileCount: 1,
    },
    pdf: {
        maxFileSize: '16MB',
        maxFileCount: 1,
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
        select: {
            id: true,
            role: true,
            memberProfile: { select: { id: true } },
        },
    });
    if (!user || !user.memberProfile) {
        throw new Error('Member profile not found');
    }
    return { userId, memberId: user.memberProfile.id };
}))
    .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) {
    return ({
        userId: metadata.userId,
        memberId: metadata.memberId,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
    });
}));
const createSeminaryDocumentUploaderRoute = () => f({
    image: {
        maxFileSize: '8MB',
        maxFileCount: 1,
    },
    pdf: {
        maxFileSize: '16MB',
        maxFileCount: 1,
    },
})
    .middleware(() => __awaiter(void 0, void 0, void 0, function* () { return ({}); }))
    .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ file }) {
    return ({
        fileUrl: file.ufsUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
    });
}));
const createSeminaryStudyMaterialUploaderRoute = () => f({
    blob: {
        maxFileSize: '32MB',
        maxFileCount: 1,
    },
})
    .middleware(() => __awaiter(void 0, void 0, void 0, function* () { return ({}); }))
    .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ file }) {
    return ({
        fileUrl: file.ufsUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
    });
}));
const createMemberProfileBannerUploaderRoute = (options = {}) => {
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
            select: {
                id: true,
                role: true,
                memberProfile: { select: { id: true } },
            },
        });
        if (!user || !user.memberProfile) {
            throw new Error('Member profile not found');
        }
        return { userId, memberId: user.memberProfile.id };
    }))
        .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) {
        return ({
            userId: metadata.userId,
            memberId: metadata.memberId,
            fileUrl: file.ufsUrl,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
        });
    }));
};
const createMemberCertificateUploaderRoute = () => f({
    image: {
        maxFileSize: '8MB',
        maxFileCount: 1,
    },
    pdf: {
        maxFileSize: '16MB',
        maxFileCount: 1,
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
        select: { id: true, memberProfile: { select: { id: true } } },
    });
    if (!user || !user.memberProfile) {
        throw new Error('Member profile not found');
    }
    return { userId, memberId: user.memberProfile.id };
}))
    .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) {
    return ({
        userId: metadata.userId,
        memberId: metadata.memberId,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
    });
}));
const createMemberPublicRecordAttachmentUploaderRoute = (options = {}) => {
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
            select: { id: true, memberProfile: { select: { id: true } } },
        });
        if (!user || !user.memberProfile) {
            throw new Error('Member profile not found');
        }
        return { userId, memberId: user.memberProfile.id };
    }))
        .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) {
        return ({
            userId: metadata.userId,
            memberId: metadata.memberId,
            fileUrl: file.ufsUrl,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
        });
    }));
};
const createEventThumbnailUploaderRoute = (options = {}) => {
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
            select: { id: true, role: true },
        });
        if (!user || user.role !== enums_1.UserType.ADMIN) {
            throw new Error('Only admins can upload event thumbnails');
        }
        return { userId };
    }))
        .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) {
        return ({
            userId: metadata.userId,
            fileUrl: file.ufsUrl,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
        });
    }));
};
const createNewsBlogMediaUploaderRoute = (options = {}) => {
    var _a;
    const maxFileSize = (_a = options.maxFileSize) !== null && _a !== void 0 ? _a : defaultUploadLimits.maxFileSize;
    const maxFileCount = sanitizeMaxFileCount(options.maxFileCount);
    return f({
        image: {
            maxFileSize,
            maxFileCount,
        },
        video: {
            maxFileSize: '32MB',
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
            select: { id: true, role: true },
        });
        if (!user || user.role !== enums_1.UserType.ADMIN) {
            throw new Error('Only admins can upload news blog media');
        }
        return { userId };
    }))
        .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) {
        return ({
            userId: metadata.userId,
            fileUrl: file.ufsUrl,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
        });
    }));
};
const createBulletinFileUploaderRoute = () => f({
    image: {
        maxFileSize: '8MB',
        maxFileCount: 1,
    },
    pdf: {
        maxFileSize: '16MB',
        maxFileCount: 1,
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
        select: { id: true, role: true },
    });
    if (!user || user.role !== enums_1.UserType.ADMIN) {
        throw new Error('Only admins can upload bulletin files');
    }
    return { userId };
}))
    .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) {
    return ({
        userId: metadata.userId,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
    });
}));
const createChaplainProductImageUploaderRoute = () => f({
    image: {
        maxFileSize: '8MB',
        maxFileCount: 1,
    },
})
    .middleware((_a) => __awaiter(void 0, [_a], void 0, function* ({ req }) {
    const authHeader = req.headers.authorization;
    const bearerToken = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))
        ? authHeader.slice('Bearer '.length).trim()
        : undefined;
    if (!bearerToken)
        throw new Error('Unauthorized upload attempt');
    const decoded = (0, jwt_1.verifyAccessToken)(bearerToken);
    const userId = decoded === null || decoded === void 0 ? void 0 : decoded.userId;
    if (!userId)
        throw new Error('Invalid or expired access token');
    const user = yield prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!user || user.role !== enums_1.UserType.ADMIN) {
        throw new Error('Only admins can upload chaplain product images');
    }
    return { userId };
}))
    .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) {
    return ({
        userId: metadata.userId,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
    });
}));
const createUploadRouter = (options = {}) => {
    var _a, _b;
    return ({
        avatarUploader: createAvatarUploaderRoute(options),
        requirementUploader: createMemberRequirementUploaderRoute(),
        seminaryRequirementUploader: createSeminaryDocumentUploaderRoute(),
        seminaryPaymentReceiptUploader: createSeminaryDocumentUploaderRoute(),
        seminaryStudyMaterialUploader: createSeminaryStudyMaterialUploaderRoute(),
        memberProfileBannerUploader: createMemberProfileBannerUploaderRoute(options),
        memberCertificateUploader: createMemberCertificateUploaderRoute(),
        memberPublicRecordAttachmentUploader: createMemberPublicRecordAttachmentUploaderRoute({
            maxFileSize: (_a = options.maxFileSize) !== null && _a !== void 0 ? _a : '8MB',
            maxFileCount: (_b = options.maxFileCount) !== null && _b !== void 0 ? _b : 6,
        }),
        eventThumbnailUploader: createEventThumbnailUploaderRoute(options),
        newsBlogMediaUploader: createNewsBlogMediaUploaderRoute(options),
        bulletinFileUploader: createBulletinFileUploaderRoute(),
        chaplainProductImageUploader: createChaplainProductImageUploaderRoute(),
    });
};
exports.createUploadRouter = createUploadRouter;
exports.uploadRouter = (0, exports.createUploadRouter)();
const createUploadthingExpressHandler = (options = {}) => (0, express_1.createRouteHandler)({ router: (0, exports.createUploadRouter)(options) });
exports.createUploadthingExpressHandler = createUploadthingExpressHandler;
