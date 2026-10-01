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
exports.restoreBackup = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const activity_log_1 = require("@/lib/activity-log");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const backup_database_shared_1 = require("./backup-database-shared");
const restoreBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!snapshot) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Backup snapshot not found',
            });
            return;
        }
        if (!snapshot.fileUrl) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'This backup snapshot cannot be restored',
            });
            return;
        }
        yield (0, backup_database_shared_1.restoreDatabaseBackupSnapshot)({
            snapshot,
            restoredByUserId: req.userId,
        });
        (0, activity_log_1.setActivityLogContext)(req, {
            actionType: client_1.ActivityLogActionType.UPDATE,
            actionLabel: 'Restored database backup',
            moduleLabel: 'Backup Database',
            targetLabel: snapshot.fileName,
            description: `Restored the database using ${snapshot.fileName}.`,
            metadata: ['Database restore', 'JSON import'],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Backup restored successfully',
            data: {
                id: snapshot.id,
                fileName: snapshot.fileName,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while restoring backup snapshot', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: err instanceof Error ? err.message : 'Internal server error',
        });
    }
});
exports.restoreBackup = restoreBackup;
