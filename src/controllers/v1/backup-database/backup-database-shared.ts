import {
  BackupFrequency,
  BackupSnapshotSource,
  BackupSnapshotStatus,
  type DatabaseBackupSettings,
  type DatabaseBackupSnapshot,
  type Prisma,
} from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { utapi } from '@/lib/uploadthing';
import { logger } from '@/lib/winston';
import { createActivityLog } from '@/lib/activity-log';
import {
  ActivityLogActionType,
  ActivityLogResult,
} from '@/generated/prisma/client';

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
] as const;

type BackupPayload = {
  version: '1.0.0';
  exportedAt: string;
  tables: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      password: string;
      avatar: string | null;
      position: string | null;
      accountStatus: string;
      isEmailVerified: boolean;
      isTwoFactorEnabled: boolean;
      twoFactorSecret: string | null;
      role: string;
      createdAt: string;
      updatedAt: string;
    }>;
    passkeyCredentials: Array<{
      id: string;
      credentialID: string;
      publicKeyBase64: string;
      counter: number;
      deviceType: string;
      backedUp: boolean;
      transports: string[];
      label: string | null;
      userId: string;
      createdAt: string;
      updatedAt: string;
    }>;
    members: Array<Record<string, unknown>>;
    ministerialExperiences: Array<Record<string, unknown>>;
    characterReferences: Array<Record<string, unknown>>;
    applicantSignatures: Array<Record<string, unknown>>;
    applicantRequirements: Array<Record<string, unknown>>;
    memberOnboardingProgress: Array<Record<string, unknown>>;
    memberPaymentCheckouts: Array<Record<string, unknown>>;
    memberOnlineInterviewAppointments: Array<Record<string, unknown>>;
    memberIdGenerationAssets: Array<Record<string, unknown>>;
    memberChaplaincyTrainingProgress: Array<Record<string, unknown>>;
    branchOfServices: Array<Record<string, unknown>>;
    officeTitles: Array<Record<string, unknown>>;
    officerAssignments: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
    eventAttendees: Array<Record<string, unknown>>;
  };
};

const toIsoString = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null;

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const size = bytes / 1024 ** exponent;
  return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

export const serializeBackupSnapshot = (snapshot: DatabaseBackupSnapshot) => ({
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

export const calculateNextBackupRun = (
  frequency: BackupFrequency,
  fromDate: Date = new Date(),
): Date => {
  const nextRun = new Date(fromDate);

  if (frequency === BackupFrequency.HOURLY) {
    nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
    return nextRun;
  }

  if (frequency === BackupFrequency.WEEKLY) {
    nextRun.setDate(nextRun.getDate() + 7);
    nextRun.setHours(6, 0, 0, 0);
    return nextRun;
  }

  nextRun.setDate(nextRun.getDate() + 1);
  nextRun.setHours(6, 0, 0, 0);
  return nextRun;
};

export const getOrCreateBackupSettings = async (): Promise<DatabaseBackupSettings> => {
  const existingSettings = await prisma.databaseBackupSettings.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (existingSettings) {
    return existingSettings;
  }

  return prisma.databaseBackupSettings.create({
    data: {
      automaticBackupEnabled: true,
      frequency: BackupFrequency.DAILY,
      retentionDays: 30,
      nextRunAt: calculateNextBackupRun(BackupFrequency.DAILY),
    },
  });
};

export const pruneExpiredBackups = async (): Promise<void> => {
  const snapshots = await prisma.databaseBackupSnapshot.findMany({
    where: {
      status: BackupSnapshotStatus.READY,
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
    const expiresAt =
      snapshot.createdAt.getTime() + snapshot.retentionDays * 24 * 60 * 60 * 1000;
    return expiresAt <= now;
  });

  if (expiredSnapshots.length === 0) return;

  const fileKeys = expiredSnapshots
    .map((snapshot) => snapshot.fileKey)
    .filter((value): value is string => Boolean(value));

  if (fileKeys.length > 0) {
    await utapi.deleteFiles(fileKeys);
  }

  await prisma.databaseBackupSnapshot.deleteMany({
    where: {
      id: {
        in: expiredSnapshots.map((snapshot) => snapshot.id),
      },
    },
  });
};

const mapDateFields = <T extends Record<string, unknown>>(
  records: T[],
  dateKeys: Array<keyof T>,
) =>
  records.map((record) => ({
    ...record,
    ...Object.fromEntries(
      dateKeys.map((key) => [
        key,
        record[key] instanceof Date ? (record[key] as Date).toISOString() : record[key],
      ]),
    ),
  }));

const mapRecordDatesToDateObjects = <T extends Record<string, unknown>>(
  records: T[],
  dateKeys: Array<keyof T>,
) =>
  records.map((record) => ({
    ...record,
    ...Object.fromEntries(
      dateKeys.map((key) => [
        key,
        typeof record[key] === 'string' ? new Date(record[key] as string) : record[key],
      ]),
    ),
  }));

const buildBackupPayload = async (): Promise<BackupPayload> => {
  const [
    users,
    passkeyCredentials,
    members,
    ministerialExperiences,
    characterReferences,
    applicantSignatures,
    applicantRequirements,
    memberOnboardingProgress,
    memberPaymentCheckouts,
    memberOnlineInterviewAppointments,
    memberIdGenerationAssets,
    memberChaplaincyTrainingProgress,
    branchOfServices,
    officeTitles,
    officerAssignments,
    events,
    eventAttendees,
  ] = await prisma.$transaction([
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.passkeyCredential.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.member.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.ministerialExperience.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.characterReference.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.applicantSignature.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.applicantRequirement.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.memberOnboardingProgress.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.memberPaymentCheckout.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.memberOnlineInterviewAppointment.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.memberIdGenerationAsset.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.memberChaplaincyTrainingProgress.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.branchOfService.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.officeTitle.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.officerAssignment.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.event.findMany({
      orderBy: { createdAt: 'asc' },
    }),
    prisma.eventAttendee.findMany({
      orderBy: { invitedAt: 'asc' },
    }),
  ]);

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tables: {
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        avatar: user.avatar ?? null,
        position: user.position ?? null,
        accountStatus: user.accountStatus,
        isEmailVerified: user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        twoFactorSecret: user.twoFactorSecret ?? null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
      passkeyCredentials: passkeyCredentials.map((credential) => ({
        id: credential.id,
        credentialID: credential.credentialID,
        publicKeyBase64: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        deviceType: credential.deviceType,
        backedUp: credential.backedUp,
        transports: credential.transports,
        label: credential.label ?? null,
        userId: credential.userId,
        createdAt: credential.createdAt.toISOString(),
        updatedAt: credential.updatedAt.toISOString(),
      })),
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
      memberOnlineInterviewAppointments: mapDateFields(
        memberOnlineInterviewAppointments,
        ['confirmedAt', 'createdAt', 'updatedAt'],
      ),
      memberIdGenerationAssets: mapDateFields(memberIdGenerationAssets, [
        'generatedAt',
        'createdAt',
        'updatedAt',
      ]),
      memberChaplaincyTrainingProgress: mapDateFields(
        memberChaplaincyTrainingProgress,
        ['completedAt', 'createdAt', 'updatedAt'],
      ),
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
};

const uploadBackupPayload = async ({
  fileName,
  json,
}: {
  fileName: string;
  json: string;
}) => {
  const file = new File([json], fileName, { type: 'application/json' });
  const uploadResult = await utapi.uploadFiles(file);
  const result = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Failed to upload backup file');
  }

  return result.data;
};

export const buildBackupFileName = (source: BackupSnapshotSource): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const sourceLabel = source === BackupSnapshotSource.AUTOMATIC ? 'auto' : 'manual';

  return `pearl-backup-${sourceLabel}-${year}-${month}-${day}-${hour}${minute}.json`;
};

export const createDatabaseBackupSnapshot = async ({
  source,
  createdByUserId,
}: {
  source: BackupSnapshotSource;
  createdByUserId?: string;
}) => {
  const settings = await getOrCreateBackupSettings();
  const payload = await buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const sizeBytes = Buffer.byteLength(json, 'utf8');
  const fileName = buildBackupFileName(source);

  try {
    const uploadedFile = await uploadBackupPayload({ fileName, json });

    const snapshot = await prisma.databaseBackupSnapshot.create({
      data: {
        fileKey: uploadedFile.key ?? null,
        fileUrl: uploadedFile.ufsUrl,
        fileName,
        source,
        status: BackupSnapshotStatus.READY,
        sizeBytes,
        tableCount: BACKUP_TABLE_NAMES.length,
        retentionDays: settings.retentionDays,
        metadata: {
          exportedAt: payload.exportedAt,
          version: payload.version,
          tables: BACKUP_TABLE_NAMES,
        },
        createdByUserId: createdByUserId ?? null,
      },
    });

    if (source === BackupSnapshotSource.AUTOMATIC) {
      await createActivityLog({
        actorName: 'System',
        actorEmail: 'system@local',
        actionType: ActivityLogActionType.EXPORT,
        actionLabel: 'Created automatic database backup',
        moduleLabel: 'Backup Database',
        targetLabel: fileName,
        description: `System created the automatic backup snapshot ${fileName}.`,
        result: ActivityLogResult.SUCCESS,
        metadata: ['Automatic backup', 'JSON export'],
      });
    }

    return snapshot;
  } catch (error) {
    await prisma.databaseBackupSnapshot.create({
      data: {
        fileKey: null,
        fileUrl: '',
        fileName,
        source,
        status: BackupSnapshotStatus.FAILED,
        sizeBytes: 0,
        tableCount: BACKUP_TABLE_NAMES.length,
        retentionDays: settings.retentionDays,
        metadata: {
          failure: error instanceof Error ? error.message : 'Unknown backup error',
        },
        createdByUserId: createdByUserId ?? null,
      },
    });

    if (source === BackupSnapshotSource.AUTOMATIC) {
      await createActivityLog({
        actorName: 'System',
        actorEmail: 'system@local',
        actionType: ActivityLogActionType.EXPORT,
        actionLabel: 'Automatic backup failed',
        moduleLabel: 'Backup Database',
        targetLabel: fileName,
        description: `System failed to create the automatic backup snapshot ${fileName}.`,
        result: ActivityLogResult.FAILED,
        metadata: ['Automatic backup', 'JSON export'],
      });
    }

    throw error;
  }
};

const fetchBackupPayload = async (snapshot: DatabaseBackupSnapshot): Promise<BackupPayload> => {
  const response = await fetch(snapshot.fileUrl);

  if (!response.ok) {
    throw new Error('Unable to fetch backup snapshot file');
  }

  return (await response.json()) as BackupPayload;
};

const runCreateMany = async <T extends Record<string, unknown>>(
  delegate: {
    createMany: (args: { data: T[]; skipDuplicates?: boolean }) => Promise<unknown>;
  },
  data: T[],
): Promise<void> => {
  if (!data.length) return;
  await delegate.createMany({
    data,
    skipDuplicates: true,
  });
};

export const restoreDatabaseBackupSnapshot = async ({
  snapshot,
  restoredByUserId,
}: {
  snapshot: DatabaseBackupSnapshot;
  restoredByUserId?: string;
}) => {
  const payload = await fetchBackupPayload(snapshot);

  await prisma.$transaction(async (tx) => {
    await tx.eventAttendee.deleteMany();
    await tx.event.deleteMany();
    await tx.officerAssignment.deleteMany();
    await tx.officeTitle.deleteMany();
    await tx.branchOfService.deleteMany();
    await tx.memberChaplaincyTrainingProgress.deleteMany();
    await tx.memberIdGenerationAsset.deleteMany();
    await tx.memberOnlineInterviewAppointment.deleteMany();
    await tx.memberPaymentCheckout.deleteMany();
    await tx.memberOnboardingProgress.deleteMany();
    await tx.applicantRequirement.deleteMany();
    await tx.applicantSignature.deleteMany();
    await tx.characterReference.deleteMany();
    await tx.ministerialExperience.deleteMany();
    await tx.member.deleteMany();
    await tx.passkeyCredential.deleteMany();
    await tx.user.deleteMany();

    await runCreateMany(
      tx.user,
      payload.tables.users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        avatar: user.avatar,
        position: user.position as Prisma.UserCreateManyInput['position'],
        accountStatus:
          user.accountStatus as Prisma.UserCreateManyInput['accountStatus'],
        isEmailVerified: user.isEmailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        twoFactorSecret: user.twoFactorSecret,
        role: user.role as Prisma.UserCreateManyInput['role'],
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      })),
    );

    await runCreateMany(
      tx.passkeyCredential,
      payload.tables.passkeyCredentials.map((credential) => ({
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
      })),
    );

    await runCreateMany(
      tx.member,
      mapRecordDatesToDateObjects(
        payload.tables.members as Prisma.MemberCreateManyInput[],
        ['dateOfBirth', 'createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.ministerialExperience,
      mapRecordDatesToDateObjects(
        payload.tables.ministerialExperiences as Prisma.MinisterialExperienceCreateManyInput[],
        ['createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.characterReference,
      mapRecordDatesToDateObjects(
        payload.tables.characterReferences as Prisma.CharacterReferenceCreateManyInput[],
        ['createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.applicantSignature,
      mapRecordDatesToDateObjects(
        payload.tables.applicantSignatures as Prisma.ApplicantSignatureCreateManyInput[],
        ['createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.applicantRequirement,
      mapRecordDatesToDateObjects(
        payload.tables.applicantRequirements as Prisma.ApplicantRequirementCreateManyInput[],
        ['createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.memberOnboardingProgress,
      mapRecordDatesToDateObjects(
        payload.tables.memberOnboardingProgress as Prisma.MemberOnboardingProgressCreateManyInput[],
        ['preOrientationCompletedAt', 'createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.memberPaymentCheckout,
      mapRecordDatesToDateObjects(
        payload.tables.memberPaymentCheckouts as Prisma.MemberPaymentCheckoutCreateManyInput[],
        ['submittedAt', 'createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.memberOnlineInterviewAppointment,
      mapRecordDatesToDateObjects(
        payload.tables.memberOnlineInterviewAppointments as Prisma.MemberOnlineInterviewAppointmentCreateManyInput[],
        ['confirmedAt', 'createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.memberIdGenerationAsset,
      mapRecordDatesToDateObjects(
        payload.tables.memberIdGenerationAssets as Prisma.MemberIdGenerationAssetCreateManyInput[],
        ['generatedAt', 'createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.memberChaplaincyTrainingProgress,
      mapRecordDatesToDateObjects(
        payload.tables.memberChaplaincyTrainingProgress as Prisma.MemberChaplaincyTrainingProgressCreateManyInput[],
        ['completedAt', 'createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.branchOfService,
      mapRecordDatesToDateObjects(
        payload.tables.branchOfServices as Prisma.BranchOfServiceCreateManyInput[],
        ['createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.officeTitle,
      mapRecordDatesToDateObjects(
        payload.tables.officeTitles as Prisma.OfficeTitleCreateManyInput[],
        ['createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.officerAssignment,
      mapRecordDatesToDateObjects(
        payload.tables.officerAssignments as Prisma.OfficerAssignmentCreateManyInput[],
        ['startDate', 'endDate', 'createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.event,
      mapRecordDatesToDateObjects(
        payload.tables.events as Prisma.EventCreateManyInput[],
        ['startsAt', 'endsAt', 'createdAt', 'updatedAt'],
      ),
    );
    await runCreateMany(
      tx.eventAttendee,
      mapRecordDatesToDateObjects(
        payload.tables.eventAttendees as Prisma.EventAttendeeCreateManyInput[],
        ['invitedAt', 'updatedAt'],
      ),
    );

    await tx.databaseBackupSnapshot.update({
      where: { id: snapshot.id },
      data: {
        restoredAt: new Date(),
        restoredByUserId: restoredByUserId ?? null,
      },
    });
  });
};

export const maybeRunAutomaticBackup = async (options: {
  trigger?: 'overview' | 'scheduler';
} = {}): Promise<void> => {
  const lockRows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(${AUTOMATIC_BACKUP_LOCK_KEY}) AS locked
  `;
  const hasLock = lockRows[0]?.locked === true;

  if (!hasLock) {
    return;
  }

  try {
    const settings = await getOrCreateBackupSettings();

    if (!settings.automaticBackupEnabled || !settings.nextRunAt) {
      return;
    }

    if (settings.nextRunAt > new Date()) {
      return;
    }

    try {
      await createDatabaseBackupSnapshot({
        source: BackupSnapshotSource.AUTOMATIC,
      });

      await prisma.databaseBackupSettings.update({
        where: { id: settings.id },
        data: {
          nextRunAt: calculateNextBackupRun(settings.frequency, new Date()),
        },
      });
    } catch (error) {
      logger.error('Automatic database backup failed', {
        error,
        trigger: options.trigger ?? 'overview',
      });
      await prisma.databaseBackupSettings.update({
        where: { id: settings.id },
        data: {
          nextRunAt: calculateNextBackupRun(settings.frequency, new Date()),
        },
      });
    }
  } finally {
    await prisma.$executeRaw`
      SELECT pg_advisory_unlock(${AUTOMATIC_BACKUP_LOCK_KEY})
    `;
  }
};

export const buildBackupOverviewResponse = async () => {
  await pruneExpiredBackups();
  await maybeRunAutomaticBackup();

  const settings = await getOrCreateBackupSettings();
  const snapshots = await prisma.databaseBackupSnapshot.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const readySnapshots = snapshots.filter(
    (snapshot) => snapshot.status === BackupSnapshotStatus.READY,
  );
  const failedSnapshots = snapshots.filter(
    (snapshot) => snapshot.status === BackupSnapshotStatus.FAILED,
  );
  const latestSnapshot = snapshots[0] ?? null;

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
    latestSnapshot: latestSnapshot ? serializeBackupSnapshot(latestSnapshot) : null,
    snapshots: snapshots.map(serializeBackupSnapshot),
  };
};
