"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeActivityLog = void 0;
const serializeActivityLog = (log) => {
    var _a, _b, _c;
    return ({
        id: log.id,
        actorId: (_a = log.userId) !== null && _a !== void 0 ? _a : log.id,
        userId: log.userId,
        actorName: log.actorName,
        actorEmail: log.actorEmail,
        actorAvatar: log.actorAvatar,
        actionType: log.actionType,
        actionLabel: log.actionLabel,
        moduleLabel: log.moduleLabel,
        targetLabel: log.targetLabel,
        description: log.description,
        result: log.result,
        timestamp: log.createdAt.toISOString(),
        ipAddress: (_b = log.ipAddress) !== null && _b !== void 0 ? _b : 'Unknown',
        deviceLabel: (_c = log.deviceLabel) !== null && _c !== void 0 ? _c : 'Unknown device',
        metadata: Array.isArray(log.metadata)
            ? log.metadata.filter((item) => typeof item === 'string')
            : [],
    });
};
exports.serializeActivityLog = serializeActivityLog;
