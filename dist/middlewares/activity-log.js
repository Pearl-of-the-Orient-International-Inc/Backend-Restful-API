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
exports.activityLogMiddleware = void 0;
const client_1 = require("../generated/prisma/client");
const activity_log_1 = require("../lib/activity-log");
const prisma_1 = require("../lib/prisma");
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const EXCLUDED_PATHS = [
    '/api/v1/auth/login',
    '/api/v1/auth/logout',
    '/api/v1/auth/verify-two-factor',
    '/api/v1/auth/passkey/authenticate/verify',
    '/api/v1/activity-logs',
];
const shouldSkipActivityLog = (req) => {
    var _a;
    if (!MUTATION_METHODS.has(req.method.toUpperCase()))
        return true;
    if (EXCLUDED_PATHS.some((path) => req.originalUrl.startsWith(path)))
        return true;
    return ((_a = req.activityLogContext) === null || _a === void 0 ? void 0 : _a.skip) === true;
};
const getResultFromStatus = (statusCode) => {
    if (statusCode >= 500 || statusCode >= 400)
        return client_1.ActivityLogResult.FAILED;
    if (statusCode >= 300)
        return client_1.ActivityLogResult.WARNING;
    return client_1.ActivityLogResult.SUCCESS;
};
const activityLogMiddleware = (req, res, next) => {
    if (shouldSkipActivityLog(req)) {
        next();
        return;
    }
    res.on('finish', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        try {
            if (shouldSkipActivityLog(req))
                return;
            if (!req.userId)
                return;
            const user = yield prisma_1.prisma.user.findUnique({
                where: { id: req.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            });
            if (!user)
                return;
            const inferred = (0, activity_log_1.buildActivityLogContextFromRequest)(req);
            const actionLabel = (_b = (_a = req.activityLogContext) === null || _a === void 0 ? void 0 : _a.actionLabel) !== null && _b !== void 0 ? _b : inferred.actionLabel;
            const moduleLabel = (_d = (_c = req.activityLogContext) === null || _c === void 0 ? void 0 : _c.moduleLabel) !== null && _d !== void 0 ? _d : inferred.moduleLabel;
            const targetLabel = (_f = (_e = req.activityLogContext) === null || _e === void 0 ? void 0 : _e.targetLabel) !== null && _f !== void 0 ? _f : inferred.targetLabel;
            yield (0, activity_log_1.createActivityLog)({
                userId: user.id,
                actorName: user.name,
                actorEmail: user.email,
                actorAvatar: user.avatar,
                actionType: (_h = (_g = req.activityLogContext) === null || _g === void 0 ? void 0 : _g.actionType) !== null && _h !== void 0 ? _h : inferred.actionType,
                actionLabel,
                moduleLabel,
                targetLabel,
                description: (_k = (_j = req.activityLogContext) === null || _j === void 0 ? void 0 : _j.description) !== null && _k !== void 0 ? _k : `${user.name} ${actionLabel.toLowerCase()} in ${moduleLabel} for ${targetLabel}.`,
                result: getResultFromStatus(res.statusCode),
                ipAddress: inferred.ipAddress,
                deviceLabel: inferred.deviceLabel,
                metadata: (_m = (_l = req.activityLogContext) === null || _l === void 0 ? void 0 : _l.metadata) !== null && _m !== void 0 ? _m : inferred.metadata,
            });
        }
        catch (_o) {
            return;
        }
    }));
    next();
};
exports.activityLogMiddleware = activityLogMiddleware;
