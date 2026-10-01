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
exports.downloadBackup = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const activity_log_1 = require("@/lib/activity-log");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const helpers_1 = require("@/lib/helpers");
const downloadBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid backup ID is required',
            });
            return;
        }
        const snapshot = yield prisma_1.prisma.databaseBackupSnapshot.findUnique({
            where: { id },
        });
        if (!snapshot || !snapshot.fileUrl) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Backup snapshot not found',
            });
            return;
        }
        if (req.userId) {
            const user = yield prisma_1.prisma.user.findUnique({
                where: { id: req.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            });
            if (user) {
                yield (0, activity_log_1.createActivityLog)({
                    userId: user.id,
                    actorName: user.name,
                    actorEmail: user.email,
                    actorAvatar: user.avatar,
                    actionType: client_1.ActivityLogActionType.EXPORT,
                    actionLabel: 'Downloaded backup file',
                    moduleLabel: 'Backup Database',
                    targetLabel: snapshot.fileName,
                    description: `Downloaded the backup snapshot ${snapshot.fileName}.`,
                    result: client_1.ActivityLogResult.SUCCESS,
                    ipAddress: (_a = (0, helpers_1.getClientIp)(req)) !== null && _a !== void 0 ? _a : null,
                    deviceLabel: (_c = (0, helpers_1.parseUserAgent)((_b = req.headers['user-agent']) !== null && _b !== void 0 ? _b : null)) !== null && _c !== void 0 ? _c : null,
                    metadata: ['Backup download', 'JSON export'],
                });
            }
        }
        const fileResponse = yield fetch(snapshot.fileUrl);
        if (!fileResponse.ok) {
            res.status(http_codes_1.HTTPSTATUS.BAD_GATEWAY).json({
                code: 'BAD_GATEWAY',
                message: 'Unable to fetch backup file from storage',
            });
            return;
        }
        const fileBuffer = Buffer.from(yield fileResponse.arrayBuffer());
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${snapshot.fileName}"`);
        res.setHeader('Content-Length', String(fileBuffer.byteLength));
        res.status(http_codes_1.HTTPSTATUS.OK).send(fileBuffer);
    }
    catch (err) {
        winston_1.logger.error('Error while preparing backup download', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.downloadBackup = downloadBackup;
