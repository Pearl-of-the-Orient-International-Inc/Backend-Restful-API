"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeNewsBlog = exports.buildNewsBlogWriteInput = exports.serializeNewsBlogTaggedMember = exports.resolveNewsBlogStatus = exports.newsBlogInclude = exports.sanitizeCaptionHtml = exports.sanitizePlainText = void 0;
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const client_1 = require("@/generated/prisma/client");
const window = new jsdom_1.JSDOM('').window;
const DOMPurify = (0, dompurify_1.default)(window);
const ALLOWED_CAPTION_TAGS = [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'h2',
    'h3',
    'code',
    'pre',
    'hr',
];
const ALLOWED_CAPTION_ATTR = ['href', 'target', 'rel'];
const sanitizePlainText = (text) => DOMPurify.sanitize(text, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
exports.sanitizePlainText = sanitizePlainText;
const sanitizeCaptionHtml = (html) => DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ALLOWED_CAPTION_TAGS,
    ALLOWED_ATTR: ALLOWED_CAPTION_ATTR,
}).trim();
exports.sanitizeCaptionHtml = sanitizeCaptionHtml;
exports.newsBlogInclude = {
    media: {
        orderBy: { sortOrder: 'asc' },
    },
    taggedMembers: {
        orderBy: { taggedAt: 'asc' },
        include: {
            member: {
                select: {
                    id: true,
                    firstName: true,
                    middleInitial: true,
                    lastName: true,
                    extensionName: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            },
        },
    },
};
const resolveNewsBlogStatus = (newsBlog) => {
    if (newsBlog.status === client_1.NewsBlogStatus.PUBLISHED) {
        return client_1.NewsBlogStatus.PUBLISHED;
    }
    if (newsBlog.scheduledAt) {
        return client_1.NewsBlogStatus.SCHEDULED;
    }
    return client_1.NewsBlogStatus.DRAFT;
};
exports.resolveNewsBlogStatus = resolveNewsBlogStatus;
const serializeNewsBlogTaggedMember = (taggedMember) => ({
    id: taggedMember.id,
    memberId: taggedMember.memberId,
    taggedAt: taggedMember.taggedAt,
    member: {
        id: taggedMember.member.id,
        firstName: taggedMember.member.firstName,
        middleInitial: taggedMember.member.middleInitial,
        lastName: taggedMember.member.lastName,
        extensionName: taggedMember.member.extensionName,
        fullName: [
            taggedMember.member.firstName,
            taggedMember.member.middleInitial
                ? `${taggedMember.member.middleInitial.replace(/\.$/, '')}.`
                : null,
            taggedMember.member.lastName,
            taggedMember.member.extensionName,
        ]
            .filter(Boolean)
            .join(' ') || taggedMember.member.user.name,
        user: taggedMember.member.user,
    },
});
exports.serializeNewsBlogTaggedMember = serializeNewsBlogTaggedMember;
const buildNewsBlogWriteInput = ({ title, caption, status, platform, hashtags, facebookPostId, scheduledAt, publishedAt, }) => {
    const normalizedHashtags = [
        ...new Set(hashtags
            .map((tag) => (0, exports.sanitizePlainText)(tag).trim().replace(/\s+/g, ''))
            .filter(Boolean)
            .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))),
    ];
    return {
        title: (0, exports.sanitizePlainText)(title).trim(),
        caption: (0, exports.sanitizeCaptionHtml)(caption),
        status: status !== null && status !== void 0 ? status : (publishedAt
            ? client_1.NewsBlogStatus.PUBLISHED
            : scheduledAt
                ? client_1.NewsBlogStatus.SCHEDULED
                : client_1.NewsBlogStatus.DRAFT),
        platform: platform !== null && platform !== void 0 ? platform : client_1.NewsBlogPlatform.FACEBOOK,
        hashtags: normalizedHashtags,
        facebookPostId: (facebookPostId === null || facebookPostId === void 0 ? void 0 : facebookPostId.trim()) || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
    };
};
exports.buildNewsBlogWriteInput = buildNewsBlogWriteInput;
const serializeNewsBlog = (newsBlog) => (Object.assign(Object.assign({}, newsBlog), { status: (0, exports.resolveNewsBlogStatus)(newsBlog), media: 'media' in newsBlog && Array.isArray(newsBlog.media)
        ? newsBlog.media.map((mediaItem) => ({
            id: mediaItem.id,
            kind: mediaItem.kind,
            fileUrl: mediaItem.fileUrl,
            fileName: mediaItem.fileName,
            sortOrder: mediaItem.sortOrder,
            createdAt: mediaItem.createdAt,
        }))
        : [], taggedMembers: 'taggedMembers' in newsBlog && Array.isArray(newsBlog.taggedMembers)
        ? newsBlog.taggedMembers.map(exports.serializeNewsBlogTaggedMember)
        : [] }));
exports.serializeNewsBlog = serializeNewsBlog;
