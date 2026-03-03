/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response } from 'express';

export const deleteBranchService = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid Branch Service ID is required',
      });
      return;
    }

    const existingBranchService = await prisma.branchOfService.findUnique({
      where: { id },
    });

    if (!existingBranchService) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Branch service not found',
      });
      return;
    }

    await prisma.branchOfService.delete({
      where: { id },
    });

    logger.info('Branch service deleted successfully', {
      branchServiceId: id,
      title: existingBranchService.title,
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during deletion of branch service', err);
  }
};
