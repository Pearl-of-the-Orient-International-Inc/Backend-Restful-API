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
const createOrdinationDocumentUploaderRoute = () => f({
    image: { maxFileSize: '8MB', maxFileCount: 1 },
    pdf: { maxFileSize: '16MB', maxFileCount: 1 },
})
    .middleware((_a) => __awaiter(void 0, [_a], void 0, function* ({ req }) {
    const authHeader = req.headers.authorization;
    const bearerToken = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) ? authHeader.slice(7).trim() : undefined;
    const decoded = bearerToken ? (0, jwt_1.verifyAccessToken)(bearerToken) : null;
    if (!(decoded === null || decoded === void 0 ? void 0 : decoded.userId))
        throw new Error('Authentication required');
    const member = yield prisma_1.prisma.member.findUnique({ where: { userId: decoded.userId }, select: { id: true, memberType: true, status: true, isActive: true } });
    if (!member || !member.isActive || member.status !== 'APPROVED' || member.memberType !== 'PROFESSIONAL_CHAPLAIN')
        throw new Error('Only eligible Professional Chaplains may upload ordination documents');
    return { userId: decoded.userId, memberId: member.id };
}))
    .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) { return ({ memberId: metadata.memberId, fileUrl: file.ufsUrl, fileName: file.name, mimeType: file.type, fileSize: file.size }); }));
const createCrasmDocumentUploaderRoute = () => f({ image: { maxFileSize: '8MB', maxFileCount: 1 }, pdf: { maxFileSize: '16MB', maxFileCount: 1 } })
    .middleware((_a) => __awaiter(void 0, [_a], void 0, function* ({ req }) {
    var _b;
    const bearerToken = ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.startsWith('Bearer ')) ? req.headers.authorization.slice(7).trim() : undefined;
    const decoded = bearerToken ? (0, jwt_1.verifyAccessToken)(bearerToken) : null;
    if (!(decoded === null || decoded === void 0 ? void 0 : decoded.userId))
        throw new Error('Authentication required');
    const member = yield prisma_1.prisma.member.findUnique({ where: { userId: decoded.userId }, select: { id: true, memberType: true, status: true, isActive: true } });
    if (!member || !member.isActive || member.status !== 'APPROVED' || member.memberType !== 'ORDAINED_AND_COMMISSIONED_PRACTITIONER')
        throw new Error('Only eligible ordained and commissioned practitioners may upload CRASM documents');
    return { memberId: member.id };
}))
    .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) { return ({ memberId: metadata.memberId, fileUrl: file.ufsUrl, fileName: file.name, mimeType: file.type, fileSize: file.size }); }));
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
    var _b, _c;
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
    if (!user || (user.role !== enums_1.UserType.ADMIN && !user.memberProfile)) {
        throw new Error('Only members or administrators can upload certificates');
    }
    return { userId, memberId: (_c = (_b = user.memberProfile) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null };
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
const createMemberServiceLicenseUploaderRoute = () => f({
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
    const decoded = bearerToken
        ? (0, jwt_1.verifyAccessToken)(bearerToken)
        : null;
    if (!(decoded === null || decoded === void 0 ? void 0 : decoded.userId)) {
        throw new Error('Authentication required');
    }
    const member = yield prisma_1.prisma.member.findFirst({
        where: {
            userId: decoded.userId,
            isActive: true,
            status: 'APPROVED',
            memberType: 'CERTIFIED_SPECIALIST_TRAINING_OFFICER_INSTRUCTOR',
        },
        select: { id: true },
    });
    if (!member) {
        throw new Error('Only eligible service chaplains may upload a license');
    }
    return { userId: decoded.userId, memberId: member.id };
}))
    .onUploadComplete((_a) => __awaiter(void 0, [_a], void 0, function* ({ metadata, file }) {
    if (file.type !== 'image/png' && file.type !== 'application/pdf') {
        throw new Error('Service licenses must be PNG or PDF files');
    }
    return {
        userId: metadata.userId,
        memberId: metadata.memberId,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
    };
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
        ordinationDocumentUploader: createOrdinationDocumentUploaderRoute(),
        crasmDocumentUploader: createCrasmDocumentUploaderRoute(),
        seminaryRequirementUploader: createSeminaryDocumentUploaderRoute(),
        seminaryPaymentReceiptUploader: createSeminaryDocumentUploaderRoute(),
        seminaryStudyMaterialUploader: createSeminaryStudyMaterialUploaderRoute(),
        memberProfileBannerUploader: createMemberProfileBannerUploaderRoute(options),
        memberCertificateUploader: createMemberCertificateUploaderRoute(),
        memberServiceLicenseUploader: createMemberServiceLicenseUploaderRoute(),
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
