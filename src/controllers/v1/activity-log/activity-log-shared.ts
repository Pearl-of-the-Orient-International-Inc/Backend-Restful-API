import type { ActivityLog, User } from '@/generated/prisma/client';

type ActivityLogWithUser = ActivityLog & {
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar'> | null;
};

export const serializeActivityLog = (log: ActivityLogWithUser) => ({
  id: log.id,
  actorId: log.userId ?? log.id,
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
  ipAddress: log.ipAddress ?? 'Unknown',
  deviceLabel: log.deviceLabel ?? 'Unknown device',
  metadata: Array.isArray(log.metadata)
    ? log.metadata.filter((item): item is string => typeof item === 'string')
    : [],
});
