import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { Request, Response } from 'express';

type FacebookPageConfigurationRecord = {
  pageId: string;
  accessToken: string;
  expiresAt: Date | null;
  updatedAt: Date;
};

const serialize = (item: FacebookPageConfigurationRecord | null) =>
  item
    ? {
        configured: true,
        pageId: item.pageId,
        tokenLastFour: item.accessToken.slice(-4),
        expiresAt: item.expiresAt,
        updatedAt: item.updatedAt,
      }
    : {
        configured: false,
        pageId: null,
        tokenLastFour: null,
        expiresAt: null,
        updatedAt: null,
      };

export const getFacebookPageConfiguration = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const item = await prisma.facebookPageConfiguration.findUnique({
      where: { id: 'default' },
    });

    res.status(HTTPSTATUS.OK).json({ code: 'OK', data: serialize(item) });
  } catch (error) {
    logger.error('Unable to retrieve Facebook Page configuration', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to retrieve Facebook Page configuration.',
    });
  }
};

export const updateFacebookPageConfiguration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { pageId, accessToken, expiresAt } = req.body as {
      pageId: string;
      accessToken: string;
      expiresAt?: string | null;
    };

    const item = await prisma.facebookPageConfiguration.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        pageId,
        accessToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      update: {
        pageId,
        accessToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Facebook Page configuration saved.',
      data: serialize(item),
    });
  } catch (error) {
    logger.error('Unable to save Facebook Page configuration', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to save Facebook Page configuration.',
    });
  }
};

// This is called only by the authenticated server-side publishing proxy.
// The normal settings endpoint deliberately returns only a masked token.
export const getFacebookPageSyncCredentials = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const item = await prisma.facebookPageConfiguration.findUnique({
      where: { id: 'default' },
    });

    if (!item) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Facebook Page sync is not configured yet.',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      data: { pageId: item.pageId, accessToken: item.accessToken },
    });
  } catch (error) {
    logger.error('Unable to retrieve Facebook Page sync credentials', error);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to retrieve Facebook Page sync credentials.',
    });
  }
};
