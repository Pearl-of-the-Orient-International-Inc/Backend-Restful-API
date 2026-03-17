import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

import type { Request, Response } from 'express';

export const getBranchServiceById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
     const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const branchService = await prisma.branchService.findUnique({
      where: { id },
    });

    if (!branchService) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Branch service not found',
      });
      return;
    }

    logger.info('Branch service retrieved successfully', {
      branchServiceId: branchService.id,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Branch service retrieved successfully',
      data: branchService,
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during retrieval of branch service', err);
  }
};