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
exports.setActivityLogContext = exports.createActivityLog = exports.buildActivityLogContextFromRequest = void 0;
const client_1 = require("../generated/prisma/client");
const prisma_1 = require("../lib/prisma");
const helpers_1 = require("../lib/helpers");
const winston_1 = require("../lib/winston");
const MODULE_LABEL_MAP = {
    auth: 'Authentication',
    users: 'Admin Accounts',
    members: 'Members',
    'branch-service': 'Branch of Services',
    offices: 'Organizational Structure',
    events: 'Events',
    backups: 'Backup Database',
    'activity-logs': 'System Logs',
};
const normalizePathSegments = (path) => path
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment !== 'api' && segment !== 'v1');
const toTitleCase = (value) => value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
const getModuleLabel = (segments) => {
    var _a;
    const rootSegment = segments[0];
    if (!rootSegment)
        return 'Application';
    return (_a = MODULE_LABEL_MAP[rootSegment]) !== null && _a !== void 0 ? _a : toTitleCase(rootSegment);
};
const inferActionType = (method, segments) => {
    const normalizedMethod = method.toUpperCase();
    const path = segments.join('/');
    if (segments[0] === 'auth')
        return client_1.ActivityLogActionType.AUTH;
    if (path.includes('attendees'))
        return client_1.ActivityLogActionType.INVITE;
    if (path.includes('assignment') ||
        path.includes('office-holder') ||
        segments[0] === 'offices') {
        return client_1.ActivityLogActionType.ASSIGN;
    }
    if (path.includes('approve') ||
        path.includes('reject') ||
        path.includes('review')) {
        return client_1.ActivityLogActionType.REVIEW;
    }
    if (normalizedMethod === 'POST')
        return client_1.ActivityLogActionType.CREATE;
    if (normalizedMethod === 'DELETE')
        return client_1.ActivityLogActionType.DELETE;
    return client_1.ActivityLogActionType.UPDATE;
};
const inferActionVerb = (actionType, segments) => {
    const path = segments.join('/');
    if (segments[0] === 'auth' && path.includes('logout'))
        return 'Logged out';
    if (segments[0] === 'auth')
        return 'Logged in';
    if (path.includes('cancel'))
        return 'Cancelled';
    if (path.includes('attendees'))
        return 'Invited attendees';
    if (path.includes('export'))
        return 'Exported';
    if (path.includes('approve'))
        return 'Approved';
    if (path.includes('reject'))
        return 'Rejected';
    switch (actionType) {
        case client_1.ActivityLogActionType.CREATE:
            return 'Created';
        case client_1.ActivityLogActionType.DELETE:
            return 'Deleted';
        case client_1.ActivityLogActionType.INVITE:
            return 'Invited';
        case client_1.ActivityLogActionType.ASSIGN:
            return 'Assigned';
        case client_1.ActivityLogActionType.REVIEW:
            return 'Reviewed';
        case client_1.ActivityLogActionType.SECURITY:
            return 'Updated security settings';
        case client_1.ActivityLogActionType.AUTH:
            return 'Authenticated';
        case client_1.ActivityLogActionType.EXPORT:
            return 'Exported';
        case client_1.ActivityLogActionType.UPDATE:
        default:
            return 'Updated';
    }
};
const inferTargetLabel = (segments, params) => {
    if (segments[0] === 'auth') {
        if (segments.includes('logout'))
            return 'Admin portal session';
        if (segments.includes('verify-two-factor'))
            return 'Two-factor sign-in';
        if (segments.includes('passkey'))
            return 'Passkey sign-in';
        return 'Admin portal';
    }
    if (typeof params.id === 'string')
        return params.id;
    if (typeof params.userId === 'string')
        return params.userId;
    if (typeof params.memberId === 'string')
        return params.memberId;
    if (typeof params.assignmentId === 'string')
        return params.assignmentId;
    if (typeof params.sessionId === 'string')
        return params.sessionId;
    const lastSegment = segments.length > 0 ? segments[segments.length - 1] : undefined;
    if (!lastSegment)
        return 'Application';
    if (/^[a-f0-9-]{8,}$/i.test(lastSegment))
        return 'Record';
    return toTitleCase(lastSegment);
};
const inferDescription = ({ actorName, actionLabel, moduleLabel, targetLabel, }) => `${actorName} ${actionLabel.toLowerCase()} in ${moduleLabel} for ${targetLabel}.`;
const buildActivityLogContextFromRequest = (req) => {
    var _a, _b, _c;
    const segments = normalizePathSegments(req.originalUrl || req.baseUrl || req.path);
    const actionType = inferActionType(req.method, segments);
    const moduleLabel = getModuleLabel(segments);
    const targetLabel = inferTargetLabel(segments, req.params);
    const actionLabel = `${inferActionVerb(actionType, segments)} ${moduleLabel
        .replace(/^Admin /, '')
        .replace(/^System /, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()}`;
    return {
        actionType,
        actionLabel: actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1),
        moduleLabel,
        targetLabel,
        description: inferDescription({
            actorName: 'User',
            actionLabel,
            moduleLabel,
            targetLabel,
        }),
        ipAddress: (_a = (0, helpers_1.getClientIp)(req)) !== null && _a !== void 0 ? _a : null,
        deviceLabel: (_c = (0, helpers_1.parseUserAgent)((_b = req.headers['user-agent']) !== null && _b !== void 0 ? _b : null)) !== null && _c !== void 0 ? _c : null,
        metadata: [
            req.method.toUpperCase(),
            normalizePathSegments(req.originalUrl || req.path).join('/') || 'root',
        ],
    };
};
exports.buildActivityLogContextFromRequest = buildActivityLogContextFromRequest;
const createActivityLog = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, actorName, actorEmail, actorAvatar, actionType, actionLabel, moduleLabel, targetLabel, description, result, ipAddress, deviceLabel, metadata, }) {
    try {
        yield prisma_1.prisma.activityLog.create({
            data: Object.assign({ userId: userId !== null && userId !== void 0 ? userId : null, actorName,
                actorEmail, actorAvatar: actorAvatar !== null && actorAvatar !== void 0 ? actorAvatar : null, actionType,
                actionLabel,
                moduleLabel,
                targetLabel,
                description,
                result, ipAddress: ipAddress !== null && ipAddress !== void 0 ? ipAddress : null, deviceLabel: deviceLabel !== null && deviceLabel !== void 0 ? deviceLabel : null }, (metadata !== undefined ? { metadata } : {})),
        });
    }
    catch (error) {
        winston_1.logger.error('Failed to create activity log', { error });
    }
});
exports.createActivityLog = createActivityLog;
const setActivityLogContext = (req, context) => {
    req.activityLogContext = Object.assign(Object.assign({}, req.activityLogContext), context);
};
exports.setActivityLogContext = setActivityLogContext;
