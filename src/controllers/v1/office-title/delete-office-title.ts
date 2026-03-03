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

export const deleteOfficeTitle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid Office Title ID is required',
      });
      return;
    }

    const existingOffice = await prisma.officeTitle.findUnique({
      where: { id },
    });

    if (!existingOffice) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Office title not found',
      });
      return;
    }

    await prisma.officeTitle.delete({
      where: { id },
    });

    logger.info('Office title deleted successfully', {
      officeTitleId: id,
      name: existingOffice.name,
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during deletion of office title', err);
  }
};
