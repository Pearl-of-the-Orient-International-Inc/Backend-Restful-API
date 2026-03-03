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

export const getOfficeById = async (
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

    // Fetch the office by ID
    const office = await prisma.officeTitle.findUnique({
      where: { id },
    });

    if (!office) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Office not found',
      });
      return;
    }

    const { name, ...officePayload } = office;

    logger.info('Office retrieved successfully', {
      officeId: office.id,
      title: office.name,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Office retrieved successfully',
      data: {
        ...officePayload,
        title: name,
      },
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during retrieval of office', err);
  }
};
