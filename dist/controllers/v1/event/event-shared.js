"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEventWriteInput = exports.serializeEvent = exports.resolveEventStatus = exports.inferMeetingPlatform = exports.normalizeOptionalText = exports.sanitizeText = void 0;
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const client_1 = require("../../../generated/prisma/client");
const window = new jsdom_1.JSDOM('').window;
const DOMPurify = (0, dompurify_1.default)(window);
const sanitizeText = (text) => DOMPurify.sanitize(text, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
exports.sanitizeText = sanitizeText;
const normalizeOptionalText = (value) => {
    const sanitized = value ? (0, exports.sanitizeText)(value).trim() : '';
    return sanitized || null;
};
exports.normalizeOptionalText = normalizeOptionalText;
const inferMeetingPlatform = (link) => {
    var _a;
    const normalizedLink = (_a = link === null || link === void 0 ? void 0 : link.trim().toLowerCase()) !== null && _a !== void 0 ? _a : '';
    if (!normalizedLink)
        return null;
    if (normalizedLink.includes('zoom.us'))
        return client_1.EventMeetingPlatform.ZOOM;
    if (normalizedLink.includes('meet.google.com')) {
        return client_1.EventMeetingPlatform.GOOGLE_MEET;
    }
    if (normalizedLink.includes('teams.microsoft.com') ||
        normalizedLink.includes('teams.live.com')) {
        return client_1.EventMeetingPlatform.MICROSOFT_TEAMS;
    }
    return client_1.EventMeetingPlatform.OTHER;
};
exports.inferMeetingPlatform = inferMeetingPlatform;
const resolveEventStatus = (event) => {
    if (event.status === client_1.EventStatus.CANCELLED) {
        return client_1.EventStatus.CANCELLED;
    }
    const now = new Date();
    if (now >= event.startsAt && now <= event.endsAt) {
        return client_1.EventStatus.ONGOING;
    }
    if (now > event.endsAt) {
        return client_1.EventStatus.COMPLETED;
    }
    return client_1.EventStatus.SCHEDULED;
};
exports.resolveEventStatus = resolveEventStatus;
const serializeEvent = (event) => (Object.assign(Object.assign({}, event), { status: (0, exports.resolveEventStatus)(event) }));
exports.serializeEvent = serializeEvent;
const buildEventWriteInput = ({ name, category, type, location, onlineLink, meetingId, meetingPassword, description, thumbnailUrl, organizer, startsAt, endsAt, visibility, }) => {
    const normalizedType = type;
    const normalizedOnlineLink = normalizedType === client_1.EventType.ONLINE ? (0, exports.normalizeOptionalText)(onlineLink) : null;
    return {
        name: (0, exports.sanitizeText)(name).trim(),
        category,
        type: normalizedType,
        location: normalizedType === client_1.EventType.ONSITE ? (0, exports.normalizeOptionalText)(location) : null,
        onlineLink: normalizedOnlineLink,
        meetingPlatform: normalizedType === client_1.EventType.ONLINE
            ? (0, exports.inferMeetingPlatform)(normalizedOnlineLink)
            : null,
        meetingId: normalizedType === client_1.EventType.ONLINE
            ? (0, exports.normalizeOptionalText)(meetingId)
            : null,
        meetingPassword: normalizedType === client_1.EventType.ONLINE
            ? (0, exports.normalizeOptionalText)(meetingPassword)
            : null,
        description: (0, exports.sanitizeText)(description).trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        organizer: (0, exports.sanitizeText)(organizer).trim(),
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        visibility,
    };
};
exports.buildEventWriteInput = buildEventWriteInput;
