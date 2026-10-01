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
exports.buildBackupOverviewResponse = exports.maybeRunAutomaticBackup = exports.restoreDatabaseBackupSnapshot = exports.createDatabaseBackupSnapshot = exports.buildBackupFileName = exports.pruneExpiredBackups = exports.getOrCreateBackupSettings = exports.calculateNextBackupRun = exports.serializeBackupSnapshot = void 0;
const client_1 = require("@/generated/prisma/client");
const prisma_1 = require("@/lib/prisma");
const uploadthing_1 = require("@/lib/uploadthing");
const winston_1 = require("@/lib/winston");
const activity_log_1 = require("@/lib/activity-log");
const client_2 = require("@/generated/prisma/client");
const AUTOMATIC_BACKUP_LOCK_KEY = BigInt('20260324');
const BACKUP_TABLE_NAMES = [
    'User',
    'PasskeyCredential',
    'Member',
    'MinisterialExperience',
    'CharacterReference',
    'ApplicantSignature',
    'ApplicantRequirement',
    'MemberOnboardingProgress',
    'MemberPaymentCheckout',
    'MemberOnlineInterviewAppointment',
    'MemberIdGenerationAsset',
    'MemberChaplaincyTrainingProgress',
    'BranchOfService',
    'OfficeTitle',
    'OfficerAssignment',
    'Event',
    'EventAttendee',
];
const toIsoString = (value) => value ? value.toISOString() : null;
const formatBytes = (bytes) => {
    if (bytes <= 0)
        return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / Math.pow(1024, exponent);
    return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};
const serializeBackupSnapshot = (snapshot) => ({
    id: snapshot.id,
    fileName: snapshot.fileName,
    fileUrl: snapshot.fileUrl,
    createdAt: snapshot.createdAt.toISOString(),
    source: snapshot.source,
    status: snapshot.status,
    sizeBytes: snapshot.sizeBytes,
    sizeLabel: formatBytes(snapshot.sizeBytes),
    tableCount: snapshot.tableCount,
    retentionDays: snapshot.retentionDays,
    retentionLabel: `Keep for ${snapshot.retentionDays} days`,
    restoredAt: toIsoString(snapshot.restoredAt),
});
exports.serializeBackupSnapshot = serializeBackupSnapshot;
const calculateNextBackupRun = (frequency, fromDate = new Date()) => {
    const nextRun = new Date(fromDate);
    if (frequency === client_1.BackupFrequency.HOURLY) {
        nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
        return nextRun;
    }
    if (frequency === client_1.BackupFrequency.WEEKLY) {
        nextRun.setDate(nextRun.getDate() + 7);
        nextRun.setHours(6, 0, 0, 0);
        return nextRun;
    }
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(6, 0, 0, 0);
    return nextRun;
};
exports.calculateNextBackupRun = calculateNextBackupRun;
const getOrCreateBackupSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    const existingSettings = yield prisma_1.prisma.databaseBackupSettings.findFirst({
        orderBy: { createdAt: 'asc' },
    });
    if (existingSettings) {
        return existingSettings;
    }
    return prisma_1.prisma.databaseBackupSettings.create({
        data: {
            automaticBackupEnabled: true,
            frequency: client_1.BackupFrequency.DAILY,
            retentionDays: 30,
            nextRunAt: (0, exports.calculateNextBackupRun)(client_1.BackupFrequency.DAILY),
        },
    });
});
exports.getOrCreateBackupSettings = getOrCreateBackupSettings;
const pruneExpiredBackups = () => __awaiter(void 0, void 0, void 0, function* () {
    const snapshots = yield prisma_1.prisma.databaseBackupSnapshot.findMany({
        where: {
            status: client_1.BackupSnapshotStatus.READY,
        },
        select: {
            id: true,
            fileKey: true,
            createdAt: true,
            retentionDays: true,
        },
    });
    const now = Date.now();
    const expiredSnapshots = snapshots.filter((snapshot) => {
        const expiresAt = snapshot.createdAt.getTime() + snapshot.retentionDays * 24 * 60 * 60 * 1000;
        return expiresAt <= now;
    });
    if (expiredSnapshots.length === 0)
        return;
    const fileKeys = expiredSnapshots
        .map((snapshot) => snapshot.fileKey)
        .filter((value) => Boolean(value));
    if (fileKeys.length > 0) {
        yield uploadthing_1.utapi.deleteFiles(fileKeys);
    }
    yield prisma_1.prisma.databaseBackupSnapshot.deleteMany({
        where: {
            id: {
                in: expiredSnapshots.map((snapshot) => snapshot.id),
            },
        },
    });
});
exports.pruneExpiredBackups = pruneExpiredBackups;
const mapDateFields = (records, dateKeys) => records.map((record) => (Object.assign(Object.assign({}, record), Object.fromEntries(dateKeys.map((key) => [
    key,
    record[key] instanceof Date ? record[key].toISOString() : record[key],
])))));
const mapRecordDatesToDateObjects = (records, dateKeys) => records.map((record) => (Object.assign(Object.assign({}, record), Object.fromEntries(dateKeys.map((key) => [
    key,
    typeof record[key] === 'string' ? new Date(record[key]) : record[key],
])))));
const buildBackupPayload = () => __awaiter(void 0, void 0, void 0, function* () {
    const [users, passkeyCredentials, members, ministerialExperiences, characterReferences, applicantSignatures, applicantRequirements, memberOnboardingProgress, memberPaymentCheckouts, memberOnlineInterviewAppointments, memberIdGenerationAssets, memberChaplaincyTrainingProgress, branchOfServices, officeTitles, officerAssignments, events, eventAttendees,] = yield prisma_1.prisma.$transaction([
        prisma_1.prisma.user.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.passkeyCredential.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.member.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.ministerialExperience.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.characterReference.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.applicantSignature.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.applicantRequirement.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.memberOnboardingProgress.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.memberPaymentCheckout.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.memberOnlineInterviewAppointment.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.memberIdGenerationAsset.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.memberChaplaincyTrainingProgress.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.branchOfService.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.officeTitle.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.officerAssignment.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.event.findMany({
            orderBy: { createdAt: 'asc' },
        }),
        prisma_1.prisma.eventAttendee.findMany({
            orderBy: { invitedAt: 'asc' },
        }),
    ]);
    return {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tables: {
            users: users.map((user) => {
                var _a, _b, _c;
                return ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    avatar: (_a = user.avatar) !== null && _a !== void 0 ? _a : null,
                    position: (_b = user.position) !== null && _b !== void 0 ? _b : null,
                    accountStatus: user.accountStatus,
                    isEmailVerified: user.isEmailVerified,
                    isTwoFactorEnabled: user.isTwoFactorEnabled,
                    twoFactorSecret: (_c = user.twoFactorSecret) !== null && _c !== void 0 ? _c : null,
                    role: user.role,
                    createdAt: user.createdAt.toISOString(),
                    updatedAt: user.updatedAt.toISOString(),
                });
            }),
            passkeyCredentials: passkeyCredentials.map((credential) => {
                var _a;
                return ({
                    id: credential.id,
                    credentialID: credential.credentialID,
                    publicKeyBase64: Buffer.from(credential.publicKey).toString('base64'),
                    counter: credential.counter,
                    deviceType: credential.deviceType,
                    backedUp: credential.backedUp,
                    transports: credential.transports,
                    label: (_a = credential.label) !== null && _a !== void 0 ? _a : null,
                    userId: credential.userId,
                    createdAt: credential.createdAt.toISOString(),
                    updatedAt: credential.updatedAt.toISOString(),
                });
            }),
            members: mapDateFields(members, ['dateOfBirth', 'createdAt', 'updatedAt']),
            ministerialExperiences: mapDateFields(ministerialExperiences, [
                'createdAt',
                'updatedAt',
            ]),
            characterReferences: mapDateFields(characterReferences, [
                'createdAt',
                'updatedAt',
            ]),
            applicantSignatures: mapDateFields(applicantSignatures, [
                'createdAt',
                'updatedAt',
            ]),
            applicantRequirements: mapDateFields(applicantRequirements, [
                'createdAt',
                'updatedAt',
            ]),
            memberOnboardingProgress: mapDateFields(memberOnboardingProgress, [
                'preOrientationCompletedAt',
                'createdAt',
                'updatedAt',
            ]),
            memberPaymentCheckouts: mapDateFields(memberPaymentCheckouts, [
                'submittedAt',
                'createdAt',
                'updatedAt',
            ]),
            memberOnlineInterviewAppointments: mapDateFields(memberOnlineInterviewAppointments, ['confirmedAt', 'createdAt', 'updatedAt']),
            memberIdGenerationAssets: mapDateFields(memberIdGenerationAssets, [
                'generatedAt',
                'createdAt',
                'updatedAt',
            ]),
            memberChaplaincyTrainingProgress: mapDateFields(memberChaplaincyTrainingProgress, ['completedAt', 'createdAt', 'updatedAt']),
            branchOfServices: mapDateFields(branchOfServices, ['createdAt', 'updatedAt']),
            officeTitles: mapDateFields(officeTitles, ['createdAt', 'updatedAt']),
            officerAssignments: mapDateFields(officerAssignments, [
                'startDate',
                'endDate',
                'createdAt',
                'updatedAt',
            ]),
            events: mapDateFields(events, ['startsAt', 'endsAt', 'createdAt', 'updatedAt']),
            eventAttendees: mapDateFields(eventAttendees, ['invitedAt', 'updatedAt']),
        },
    };
});
const uploadBackupPayload = (_a) => __awaiter(void 0, [_a], void 0, function* ({ fileName, json, }) {
    var _b, _c;
    const file = new File([json], fileName, { type: 'application/json' });
    const uploadResult = yield uploadthing_1.utapi.uploadFiles(file);
    const result = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
    if (result.error || !result.data) {
        throw new Error((_c = (_b = result.error) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : 'Failed to upload backup file');
    }
    return result.data;
});
const buildBackupFileName = (source) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const sourceLabel = source === client_1.BackupSnapshotSource.AUTOMATIC ? 'auto' : 'manual';
    return `pearl-backup-${sourceLabel}-${year}-${month}-${day}-${hour}${minute}.json`;
};
exports.buildBackupFileName = buildBackupFileName;
const createDatabaseBackupSnapshot = (_a) => __awaiter(void 0, [_a], void 0, function* ({ source, createdByUserId, }) {
    var _b;
    const settings = yield (0, exports.getOrCreateBackupSettings)();
    const payload = yield buildBackupPayload();
    const json = JSON.stringify(payload, null, 2);
    const sizeBytes = Buffer.byteLength(json, 'utf8');
    const fileName = (0, exports.buildBackupFileName)(source);
    try {
        const uploadedFile = yield uploadBackupPayload({ fileName, json });
        const snapshot = yield prisma_1.prisma.databaseBackupSnapshot.create({
            data: {
                fileKey: (_b = uploadedFile.key) !== null && _b !== void 0 ? _b : null,
                fileUrl: uploadedFile.ufsUrl,
                fileName,
                source,
                status: client_1.BackupSnapshotStatus.READY,
                sizeBytes,
                tableCount: BACKUP_TABLE_NAMES.length,
                retentionDays: settings.retentionDays,
                metadata: {
                    exportedAt: payload.exportedAt,
                    version: payload.version,
                    tables: BACKUP_TABLE_NAMES,
                },
                createdByUserId: createdByUserId !== null && createdByUserId !== void 0 ? createdByUserId : null,
            },
        });
        if (source === client_1.BackupSnapshotSource.AUTOMATIC) {
            yield (0, activity_log_1.createActivityLog)({
                actorName: 'System',
                actorEmail: 'system@local',
                actionType: client_2.ActivityLogActionType.EXPORT,
                actionLabel: 'Created automatic database backup',
                moduleLabel: 'Backup Database',
                targetLabel: fileName,
                description: `System created the automatic backup snapshot ${fileName}.`,
                result: client_2.ActivityLogResult.SUCCESS,
                metadata: ['Automatic backup', 'JSON export'],
            });
        }
        return snapshot;
    }
    catch (error) {
        yield prisma_1.prisma.databaseBackupSnapshot.create({
            data: {
                fileKey: null,
                fileUrl: '',
                fileName,
                source,
                status: client_1.BackupSnapshotStatus.FAILED,
                sizeBytes: 0,
                tableCount: BACKUP_TABLE_NAMES.length,
                retentionDays: settings.retentionDays,
                metadata: {
                    failure: error instanceof Error ? error.message : 'Unknown backup error',
                },
                createdByUserId: createdByUserId !== null && createdByUserId !== void 0 ? createdByUserId : null,
            },
        });
        if (source === client_1.BackupSnapshotSource.AUTOMATIC) {
            yield (0, activity_log_1.createActivityLog)({
                actorName: 'System',
                actorEmail: 'system@local',
                actionType: client_2.ActivityLogActionType.EXPORT,
                actionLabel: 'Automatic backup failed',
                moduleLabel: 'Backup Database',
                targetLabel: fileName,
                description: `System failed to create the automatic backup snapshot ${fileName}.`,
                result: client_2.ActivityLogResult.FAILED,
                metadata: ['Automatic backup', 'JSON export'],
            });
        }
        throw error;
    }
});
exports.createDatabaseBackupSnapshot = createDatabaseBackupSnapshot;
const fetchBackupPayload = (snapshot) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(snapshot.fileUrl);
    if (!response.ok) {
        throw new Error('Unable to fetch backup snapshot file');
    }
    return (yield response.json());
});
const runCreateMany = (delegate, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!data.length)
        return;
    yield delegate.createMany({
        data,
        skipDuplicates: true,
    });
});
const restoreDatabaseBackupSnapshot = (_a) => __awaiter(void 0, [_a], void 0, function* ({ snapshot, restoredByUserId, }) {
    const payload = yield fetchBackupPayload(snapshot);
    yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.eventAttendee.deleteMany();
        yield tx.event.deleteMany();
        yield tx.officerAssignment.deleteMany();
        yield tx.officeTitle.deleteMany();
        yield tx.branchOfService.deleteMany();
        yield tx.memberChaplaincyTrainingProgress.deleteMany();
        yield tx.memberIdGenerationAsset.deleteMany();
        yield tx.memberOnlineInterviewAppointment.deleteMany();
        yield tx.memberPaymentCheckout.deleteMany();
        yield tx.memberOnboardingProgress.deleteMany();
        yield tx.applicantRequirement.deleteMany();
        yield tx.applicantSignature.deleteMany();
        yield tx.characterReference.deleteMany();
        yield tx.ministerialExperience.deleteMany();
        yield tx.member.deleteMany();
        yield tx.passkeyCredential.deleteMany();
        yield tx.user.deleteMany();
        yield runCreateMany(tx.user, payload.tables.users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            avatar: user.avatar,
            position: user.position,
            accountStatus: user.accountStatus,
            isEmailVerified: user.isEmailVerified,
            isTwoFactorEnabled: user.isTwoFactorEnabled,
            twoFactorSecret: user.twoFactorSecret,
            role: user.role,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
        })));
        yield runCreateMany(tx.passkeyCredential, payload.tables.passkeyCredentials.map((credential) => ({
            id: credential.id,
            credentialID: credential.credentialID,
            publicKey: Buffer.from(credential.publicKeyBase64, 'base64'),
            counter: credential.counter,
            deviceType: credential.deviceType,
            backedUp: credential.backedUp,
            transports: credential.transports,
            label: credential.label,
            userId: credential.userId,
            createdAt: new Date(credential.createdAt),
            updatedAt: new Date(credential.updatedAt),
        })));
        yield runCreateMany(tx.member, mapRecordDatesToDateObjects(payload.tables.members, ['dateOfBirth', 'createdAt', 'updatedAt']));
        yield runCreateMany(tx.ministerialExperience, mapRecordDatesToDateObjects(payload.tables.ministerialExperiences, ['createdAt', 'updatedAt']));
        yield runCreateMany(tx.characterReference, mapRecordDatesToDateObjects(payload.tables.characterReferences, ['createdAt', 'updatedAt']));
        yield runCreateMany(tx.applicantSignature, mapRecordDatesToDateObjects(payload.tables.applicantSignatures, ['createdAt', 'updatedAt']));
        yield runCreateMany(tx.applicantRequirement, mapRecordDatesToDateObjects(payload.tables.applicantRequirements, ['createdAt', 'updatedAt']));
        yield runCreateMany(tx.memberOnboardingProgress, mapRecordDatesToDateObjects(payload.tables.memberOnboardingProgress, ['preOrientationCompletedAt', 'createdAt', 'updatedAt']));
        yield runCreateMany(tx.memberPaymentCheckout, mapRecordDatesToDateObjects(payload.tables.memberPaymentCheckouts, ['submittedAt', 'createdAt', 'updatedAt']));
        yield runCreateMany(tx.memberOnlineInterviewAppointment, mapRecordDatesToDateObjects(payload.tables.memberOnlineInterviewAppointments, ['confirmedAt', 'createdAt', 'updatedAt']));
        yield runCreateMany(tx.memberIdGenerationAsset, mapRecordDatesToDateObjects(payload.tables.memberIdGenerationAssets, ['generatedAt', 'createdAt', 'updatedAt']));
        yield runCreateMany(tx.memberChaplaincyTrainingProgress, mapRecordDatesToDateObjects(payload.tables.memberChaplaincyTrainingProgress, ['completedAt', 'createdAt', 'updatedAt']));
        yield runCreateMany(tx.branchOfService, mapRecordDatesToDateObjects(payload.tables.branchOfServices, ['createdAt', 'updatedAt']));
        yield runCreateMany(tx.officeTitle, mapRecordDatesToDateObjects(payload.tables.officeTitles, ['createdAt', 'updatedAt']));
        yield runCreateMany(tx.officerAssignment, mapRecordDatesToDateObjects(payload.tables.officerAssignments, ['startDate', 'endDate', 'createdAt', 'updatedAt']));
        yield runCreateMany(tx.event, mapRecordDatesToDateObjects(payload.tables.events, ['startsAt', 'endsAt', 'createdAt', 'updatedAt']));
        yield runCreateMany(tx.eventAttendee, mapRecordDatesToDateObjects(payload.tables.eventAttendees, ['invitedAt', 'updatedAt']));
        yield tx.databaseBackupSnapshot.update({
            where: { id: snapshot.id },
            data: {
                restoredAt: new Date(),
                restoredByUserId: restoredByUserId !== null && restoredByUserId !== void 0 ? restoredByUserId : null,
            },
        });
    }));
});
exports.restoreDatabaseBackupSnapshot = restoreDatabaseBackupSnapshot;
const maybeRunAutomaticBackup = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (options = {}) {
    var _a, _b;
    const lockRows = yield prisma_1.prisma.$queryRaw `
    SELECT pg_try_advisory_lock(${AUTOMATIC_BACKUP_LOCK_KEY}) AS locked
  `;
    const hasLock = ((_a = lockRows[0]) === null || _a === void 0 ? void 0 : _a.locked) === true;
    if (!hasLock) {
        return;
    }
    try {
        const settings = yield (0, exports.getOrCreateBackupSettings)();
        if (!settings.automaticBackupEnabled || !settings.nextRunAt) {
            return;
        }
        if (settings.nextRunAt > new Date()) {
            return;
        }
        try {
            yield (0, exports.createDatabaseBackupSnapshot)({
                source: client_1.BackupSnapshotSource.AUTOMATIC,
            });
            yield prisma_1.prisma.databaseBackupSettings.update({
                where: { id: settings.id },
                data: {
                    nextRunAt: (0, exports.calculateNextBackupRun)(settings.frequency, new Date()),
                },
            });
        }
        catch (error) {
            winston_1.logger.error('Automatic database backup failed', {
                error,
                trigger: (_b = options.trigger) !== null && _b !== void 0 ? _b : 'overview',
            });
            yield prisma_1.prisma.databaseBackupSettings.update({
                where: { id: settings.id },
                data: {
                    nextRunAt: (0, exports.calculateNextBackupRun)(settings.frequency, new Date()),
                },
            });
        }
    }
    finally {
        yield prisma_1.prisma.$executeRaw `
      SELECT pg_advisory_unlock(${AUTOMATIC_BACKUP_LOCK_KEY})
    `;
    }
});
exports.maybeRunAutomaticBackup = maybeRunAutomaticBackup;
const buildBackupOverviewResponse = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield (0, exports.pruneExpiredBackups)();
    yield (0, exports.maybeRunAutomaticBackup)();
    const settings = yield (0, exports.getOrCreateBackupSettings)();
    const snapshots = yield prisma_1.prisma.databaseBackupSnapshot.findMany({
        orderBy: { createdAt: 'desc' },
    });
    const readySnapshots = snapshots.filter((snapshot) => snapshot.status === client_1.BackupSnapshotStatus.READY);
    const failedSnapshots = snapshots.filter((snapshot) => snapshot.status === client_1.BackupSnapshotStatus.FAILED);
    const latestSnapshot = (_a = snapshots[0]) !== null && _a !== void 0 ? _a : null;
    return {
        settings: {
            automaticBackupEnabled: settings.automaticBackupEnabled,
            frequency: settings.frequency,
            retentionDays: settings.retentionDays,
            nextRunAt: toIsoString(settings.nextRunAt),
        },
        stats: {
            totalSnapshots: snapshots.length,
            readySnapshots: readySnapshots.length,
            failedSnapshots: failedSnapshots.length,
            latestBackupAt: latestSnapshot ? latestSnapshot.createdAt.toISOString() : null,
            storageCoverage: snapshots.length
                ? Math.round((readySnapshots.length / snapshots.length) * 100)
                : 0,
            totalTables: BACKUP_TABLE_NAMES.length,
        },
        latestSnapshot: latestSnapshot ? (0, exports.serializeBackupSnapshot)(latestSnapshot) : null,
        snapshots: snapshots.map(exports.serializeBackupSnapshot),
    };
});
exports.buildBackupOverviewResponse = buildBackupOverviewResponse;
