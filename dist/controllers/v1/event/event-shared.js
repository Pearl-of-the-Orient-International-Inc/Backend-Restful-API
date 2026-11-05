"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEventWriteInput = exports.serializePublicEvent = exports.serializeEvent = exports.serializeTaggedMember = exports.eventTaggedMemberInclude = exports.resolveEventStatus = exports.inferMeetingPlatform = exports.normalizeOptionalText = exports.sanitizeText = void 0;
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
exports.eventTaggedMemberInclude = {
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
                    memberType: true,
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
const serializeTaggedMember = (taggedMember) => ({
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
        memberType: taggedMember.member.memberType,
        user: taggedMember.member.user,
    },
});
exports.serializeTaggedMember = serializeTaggedMember;
const serializeEvent = (event) => (Object.assign(Object.assign({}, event), { status: (0, exports.resolveEventStatus)(event), taggedMembers: 'taggedMembers' in event && Array.isArray(event.taggedMembers)
        ? event.taggedMembers.map(exports.serializeTaggedMember)
        : [] }));
exports.serializeEvent = serializeEvent;
const serializePublicEvent = (event) => {
    const serialized = (0, exports.serializeEvent)(event);
    const { onlineLink, meetingId, meetingPassword } = serialized, safeEvent = __rest(serialized, ["onlineLink", "meetingId", "meetingPassword"]);
    return Object.assign(Object.assign({}, safeEvent), { onlineLink: null, meetingId: null, meetingPassword: null, accessDetailsAvailable: false });
};
exports.serializePublicEvent = serializePublicEvent;
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
