import type { Request } from 'express';
import {
  ActivityLogActionType,
  ActivityLogResult,
  type Prisma,
} from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getClientIp, parseUserAgent } from '@/lib/helpers';
import { logger } from '@/lib/winston';

type ActivityMetadata = Prisma.InputJsonValue | undefined;

export type ActivityLogContext = {
  skip?: boolean;
  actionType?: ActivityLogActionType;
  actionLabel?: string;
  moduleLabel?: string;
  targetLabel?: string;
  description?: string;
  metadata?: ActivityMetadata;
};

type CreateActivityLogArgs = {
  userId?: string | null;
  actorName: string;
  actorEmail: string;
  actorAvatar?: string | null;
  actionType: ActivityLogActionType;
  actionLabel: string;
  moduleLabel: string;
  targetLabel: string;
  description: string;
  result: ActivityLogResult;
  ipAddress?: string | null;
  deviceLabel?: string | null;
  metadata?: ActivityMetadata;
};

const MODULE_LABEL_MAP: Record<string, string> = {
  auth: 'Authentication',
  users: 'Admin Accounts',
  members: 'Members',
  'branch-service': 'Branch of Services',
  offices: 'Organizational Structure',
  events: 'Events',
  backups: 'Backup Database',
  'activity-logs': 'System Logs',
};

const normalizePathSegments = (path: string): string[] =>
  path
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment !== 'api' && segment !== 'v1');

const toTitleCase = (value: string): string =>
  value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getModuleLabel = (segments: string[]): string => {
  const rootSegment = segments[0];
  if (!rootSegment) return 'Application';
  return MODULE_LABEL_MAP[rootSegment] ?? toTitleCase(rootSegment);
};

const inferActionType = (
  method: string,
  segments: string[],
): ActivityLogActionType => {
  const normalizedMethod = method.toUpperCase();
  const path = segments.join('/');

  if (segments[0] === 'auth') return ActivityLogActionType.AUTH;
  if (path.includes('attendees')) return ActivityLogActionType.INVITE;
  if (
    path.includes('assignment') ||
    path.includes('office-holder') ||
    segments[0] === 'offices'
  ) {
    return ActivityLogActionType.ASSIGN;
  }
  if (
    path.includes('approve') ||
    path.includes('reject') ||
    path.includes('review')
  ) {
    return ActivityLogActionType.REVIEW;
  }
  if (normalizedMethod === 'POST') return ActivityLogActionType.CREATE;
  if (normalizedMethod === 'DELETE') return ActivityLogActionType.DELETE;
  return ActivityLogActionType.UPDATE;
};

const inferActionVerb = (
  actionType: ActivityLogActionType,
  segments: string[],
): string => {
  const path = segments.join('/');

  if (segments[0] === 'auth' && path.includes('logout')) return 'Logged out';
  if (segments[0] === 'auth') return 'Logged in';
  if (path.includes('cancel')) return 'Cancelled';
  if (path.includes('attendees')) return 'Invited attendees';
  if (path.includes('export')) return 'Exported';
  if (path.includes('approve')) return 'Approved';
  if (path.includes('reject')) return 'Rejected';

  switch (actionType) {
    case ActivityLogActionType.CREATE:
      return 'Created';
    case ActivityLogActionType.DELETE:
      return 'Deleted';
    case ActivityLogActionType.INVITE:
      return 'Invited';
    case ActivityLogActionType.ASSIGN:
      return 'Assigned';
    case ActivityLogActionType.REVIEW:
      return 'Reviewed';
    case ActivityLogActionType.SECURITY:
      return 'Updated security settings';
    case ActivityLogActionType.AUTH:
      return 'Authenticated';
    case ActivityLogActionType.EXPORT:
      return 'Exported';
    case ActivityLogActionType.UPDATE:
    default:
      return 'Updated';
  }
};

const inferTargetLabel = (segments: string[], params: Request['params']): string => {
  if (segments[0] === 'auth') {
    if (segments.includes('logout')) return 'Admin portal session';
    if (segments.includes('verify-two-factor')) return 'Two-factor sign-in';
    if (segments.includes('passkey')) return 'Passkey sign-in';
    return 'Admin portal';
  }

  if (typeof params.id === 'string') return params.id;
  if (typeof params.userId === 'string') return params.userId;
  if (typeof params.memberId === 'string') return params.memberId;
  if (typeof params.assignmentId === 'string') return params.assignmentId;
  if (typeof params.sessionId === 'string') return params.sessionId;

  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : undefined;
  if (!lastSegment) return 'Application';
  if (/^[a-f0-9-]{8,}$/i.test(lastSegment)) return 'Record';
  return toTitleCase(lastSegment);
};

const inferDescription = ({
  actorName,
  actionLabel,
  moduleLabel,
  targetLabel,
}: {
  actorName: string;
  actionLabel: string;
  moduleLabel: string;
  targetLabel: string;
}): string =>
  `${actorName} ${actionLabel.toLowerCase()} in ${moduleLabel} for ${targetLabel}.`;

export const buildActivityLogContextFromRequest = (
  req: Request,
): Omit<
  CreateActivityLogArgs,
  'actorName' | 'actorEmail' | 'actorAvatar' | 'result' | 'userId'
> => {
  const segments = normalizePathSegments(req.originalUrl || req.baseUrl || req.path);
  const actionType = inferActionType(req.method, segments);
  const moduleLabel = getModuleLabel(segments);
  const targetLabel = inferTargetLabel(segments, req.params);
  const actionLabel = `${inferActionVerb(actionType, segments)} ${moduleLabel
    .replace(/^Admin /, '')
    .replace(/^System /, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()}`;

  return {
    actionType,
    actionLabel: actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1),
    moduleLabel,
    targetLabel,
    description: inferDescription({
      actorName: 'User',
      actionLabel,
      moduleLabel,
      targetLabel,
    }),
    ipAddress: getClientIp(req) ?? null,
    deviceLabel: parseUserAgent(req.headers['user-agent'] ?? null) ?? null,
    metadata: [
      req.method.toUpperCase(),
      normalizePathSegments(req.originalUrl || req.path).join('/') || 'root',
    ],
  };
};

export const createActivityLog = async ({
  userId,
  actorName,
  actorEmail,
  actorAvatar,
  actionType,
  actionLabel,
  moduleLabel,
  targetLabel,
  description,
  result,
  ipAddress,
  deviceLabel,
  metadata,
}: CreateActivityLogArgs): Promise<void> => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId ?? null,
        actorName,
        actorEmail,
        actorAvatar: actorAvatar ?? null,
        actionType,
        actionLabel,
        moduleLabel,
        targetLabel,
        description,
        result,
        ipAddress: ipAddress ?? null,
        deviceLabel: deviceLabel ?? null,
        ...(metadata !== undefined ? { metadata } : {}),
      },
    });
  } catch (error) {
    logger.error('Failed to create activity log', { error });
  }
};

export const setActivityLogContext = (
  req: Request,
  context: ActivityLogContext,
): void => {
  req.activityLogContext = {
    ...req.activityLogContext,
    ...context,
  };
};
