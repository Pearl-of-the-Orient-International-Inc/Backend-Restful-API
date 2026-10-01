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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopBackupDatabaseScheduler = exports.startBackupDatabaseScheduler = void 0;
const config_1 = __importDefault(require("@/config"));
const winston_1 = require("@/lib/winston");
const backup_database_shared_1 = require("@/controllers/v1/backup-database/backup-database-shared");
const MIN_INTERVAL_MS = 15000;
let backupSchedulerTimer = null;
const resolveIntervalMs = () => {
    const rawInterval = Number(config_1.default.BACKUP_SCHEDULER_INTERVAL_MS);
    if (!Number.isFinite(rawInterval) || rawInterval < MIN_INTERVAL_MS) {
        return MIN_INTERVAL_MS;
    }
    return rawInterval;
};
const runBackupSchedulerTick = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, backup_database_shared_1.maybeRunAutomaticBackup)({
            trigger: 'scheduler',
        });
    }
    catch (error) {
        winston_1.logger.error('Backup scheduler tick failed', { error });
    }
});
const startBackupDatabaseScheduler = () => {
    if (backupSchedulerTimer) {
        return;
    }
    const intervalMs = resolveIntervalMs();
    void runBackupSchedulerTick();
    backupSchedulerTimer = setInterval(() => {
        void runBackupSchedulerTick();
    }, intervalMs);
    winston_1.logger.info(`Backup scheduler started with ${intervalMs}ms interval`);
};
exports.startBackupDatabaseScheduler = startBackupDatabaseScheduler;
const stopBackupDatabaseScheduler = () => {
    if (!backupSchedulerTimer) {
        return;
    }
    clearInterval(backupSchedulerTimer);
    backupSchedulerTimer = null;
    winston_1.logger.info('Backup scheduler stopped');
};
exports.stopBackupDatabaseScheduler = stopBackupDatabaseScheduler;
