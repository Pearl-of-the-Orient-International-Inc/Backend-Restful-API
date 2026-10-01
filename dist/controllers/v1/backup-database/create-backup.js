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
exports.createBackup = void 0;
const http_codes_1 = require("@/common/http-codes");
const client_1 = require("@/generated/prisma/client");
const activity_log_1 = require("@/lib/activity-log");
const winston_1 = require("@/lib/winston");
const backup_database_shared_1 = require("./backup-database-shared");
const createBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield (0, backup_database_shared_1.createDatabaseBackupSnapshot)({
            source: client_1.BackupSnapshotSource.MANUAL,
            createdByUserId: req.userId,
        });
        (0, activity_log_1.setActivityLogContext)(req, {
            actionType: client_1.ActivityLogActionType.EXPORT,
            actionLabel: 'Created JSON backup',
            moduleLabel: 'Backup Database',
            targetLabel: snapshot.fileName,
            description: `Created the backup snapshot ${snapshot.fileName}.`,
            metadata: ['Manual backup', 'JSON export'],
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Backup created successfully',
            data: (0, backup_database_shared_1.serializeBackupSnapshot)(snapshot),
        });
    }
    catch (err) {
        winston_1.logger.error('Error while creating backup snapshot', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: err instanceof Error ? err.message : 'Internal server error',
        });
    }
});
exports.createBackup = createBackup;
