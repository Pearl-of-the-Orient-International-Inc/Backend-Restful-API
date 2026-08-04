import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  normalizeFeeCollectionStatus,
  toFeeCollectionResponse,
} from './fee-collection-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryFeeCollectionStatusBody } from './types';

export const updateSeminaryFeeCollectionStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateSeminaryFeeCollectionStatusBody;

    const account = await prisma.seminaryFeeCollectionAccount.update({
      where: { id },
      data: { status: normalizeFeeCollectionStatus(body.status) },
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary fee collection status updated successfully',
      data: toFeeCollectionResponse(account),
    });
  } catch (err) {
    logger.error('Error while updating seminary fee collection status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
