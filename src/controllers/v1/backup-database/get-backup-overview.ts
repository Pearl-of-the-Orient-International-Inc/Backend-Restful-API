import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { logger } from '@/lib/winston';
import { buildBackupOverviewResponse } from './backup-database-shared';

export const getBackupOverview = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = await buildBackupOverviewResponse();

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Backup overview retrieved successfully',
      data,
    });
  } catch (err) {
    logger.error('Error while retrieving backup overview', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
