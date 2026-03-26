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
exports.updateBackupSettings = void 0;
const http_codes_1 = require("../../../common/http-codes");
const client_1 = require("../../../generated/prisma/client");
const activity_log_1 = require("../../../lib/activity-log");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const backup_database_shared_1 = require("./backup-database-shared");
const updateBackupSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const payload = req.body;
        const settings = yield (0, backup_database_shared_1.getOrCreateBackupSettings)();
        const updatedSettings = yield prisma_1.prisma.databaseBackupSettings.update({
            where: { id: settings.id },
            data: {
                automaticBackupEnabled: payload.automaticBackupEnabled,
                frequency: payload.frequency,
                retentionDays: payload.retentionDays,
                nextRunAt: payload.automaticBackupEnabled
                    ? (0, backup_database_shared_1.calculateNextBackupRun)(payload.frequency)
                    : null,
                lastUpdatedByUserId: (_a = req.userId) !== null && _a !== void 0 ? _a : null,
            },
        });
        (0, activity_log_1.setActivityLogContext)(req, {
            actionType: client_1.ActivityLogActionType.UPDATE,
            actionLabel: 'Updated backup settings',
            moduleLabel: 'Backup Database',
            targetLabel: 'Automatic backup settings',
            description: 'Updated the backup schedule and retention settings.',
            metadata: [
                payload.automaticBackupEnabled ? 'Automatic backup enabled' : 'Automatic backup disabled',
                `Frequency: ${payload.frequency}`,
                `Retention: ${payload.retentionDays} days`,
            ],
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Backup settings updated successfully',
            data: {
                automaticBackupEnabled: updatedSettings.automaticBackupEnabled,
                frequency: updatedSettings.frequency,
                retentionDays: updatedSettings.retentionDays,
                nextRunAt: (_c = (_b = updatedSettings.nextRunAt) === null || _b === void 0 ? void 0 : _b.toISOString()) !== null && _c !== void 0 ? _c : null,
            },
        });
    }
    catch (err) {
        winston_1.logger.error('Error while updating backup settings', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.updateBackupSettings = updateBackupSettings;
