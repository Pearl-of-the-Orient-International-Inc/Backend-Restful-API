/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';

export const deleteOffice = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Extract and validate ID from params
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Validate that ID is provided and is a string
    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid Office ID is required',
      });
      return;
    }

    // Check if office exists before deleting
    const existingOffice = await prisma.office.findUnique({
      where: { id },
    });

    if (!existingOffice) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Office not found',
      });
      return;
    }

    // Delete the office
    await prisma.office.delete({
      where: { id },
    });

    logger.info('Office deleted successfully', {
      officeId: id,
      title: existingOffice.title,
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during deletion of office', err);
  }
};
