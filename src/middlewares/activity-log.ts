import type { NextFunction, Request, Response } from 'express';
import { ActivityLogResult } from '@/generated/prisma/client';
import {
  buildActivityLogContextFromRequest,
  createActivityLog,
} from '@/lib/activity-log';
import { prisma } from '@/lib/prisma';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const EXCLUDED_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/auth/verify-two-factor',
  '/api/v1/auth/passkey/authenticate/verify',
  '/api/v1/activity-logs',
];

const shouldSkipActivityLog = (req: Request): boolean => {
  if (!MUTATION_METHODS.has(req.method.toUpperCase())) return true;
  if (EXCLUDED_PATHS.some((path) => req.originalUrl.startsWith(path))) return true;
  return req.activityLogContext?.skip === true;
};

const getResultFromStatus = (statusCode: number): ActivityLogResult => {
  if (statusCode >= 500 || statusCode >= 400) return ActivityLogResult.FAILED;
  if (statusCode >= 300) return ActivityLogResult.WARNING;
  return ActivityLogResult.SUCCESS;
};

export const activityLogMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (shouldSkipActivityLog(req)) {
    next();
    return;
  }

  res.on('finish', async () => {
    try {
      if (shouldSkipActivityLog(req)) return;
      if (!req.userId) return;

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      });

      if (!user) return;

      const inferred = buildActivityLogContextFromRequest(req);
      const actionLabel = req.activityLogContext?.actionLabel ?? inferred.actionLabel;
      const moduleLabel = req.activityLogContext?.moduleLabel ?? inferred.moduleLabel;
      const targetLabel = req.activityLogContext?.targetLabel ?? inferred.targetLabel;

      await createActivityLog({
        userId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorAvatar: user.avatar,
        actionType: req.activityLogContext?.actionType ?? inferred.actionType,
        actionLabel,
        moduleLabel,
        targetLabel,
        description:
          req.activityLogContext?.description ??
          `${user.name} ${actionLabel.toLowerCase()} in ${moduleLabel} for ${targetLabel}.`,
        result: getResultFromStatus(res.statusCode),
        ipAddress: inferred.ipAddress,
        deviceLabel: inferred.deviceLabel,
        metadata: req.activityLogContext?.metadata ?? inferred.metadata,
      });
    } catch {
      return;
    }
  });

  next();
};
