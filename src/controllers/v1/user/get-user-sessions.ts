/**
 * Custom Modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { getLocationDetailsFromIP } from '@/lib/helpers';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response } from 'express';

export const getUserSessions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const currentSessionId = req.sessionId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiredAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiredAt: true,
      },
    });

    const ipCache = new Map<string, Awaited<ReturnType<typeof getLocationDetailsFromIP>>>();

    const mappedSessions = await Promise.all(
      sessions.map(async (session) => {
        const ipKey = session.ipAddress ?? 'local';
        const cached = ipCache.get(ipKey);
        const locationDetails =
          cached ??
          (await getLocationDetailsFromIP(session.ipAddress ?? null));

        if (!cached) {
          ipCache.set(ipKey, locationDetails);
        }

        return {
          id: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          expiredAt: session.expiredAt,
          isCurrent: Boolean(currentSessionId && session.id === currentSessionId),
          location: {
            city: locationDetails.city,
            region: locationDetails.region,
            country: locationDetails.country,
            label: locationDetails.label,
            coordinates:
              locationDetails.lat !== null && locationDetails.lon !== null
                ? {
                    lat: locationDetails.lat,
                    lng: locationDetails.lon,
                  }
                : null,
          },
        };
      }),
    );

    const currentSession =
      mappedSessions.find((session) => session.isCurrent) ?? null;

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'User sessions retrieved successfully',
      data: {
        currentSession,
        sessions: mappedSessions,
      },
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error while getting user sessions', err);
  }
};
