import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { HTTPSTATUS } from '@/common/http-codes';

export const getOfficeTitleById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
     const id = req.params.id as string;

    const officeTitle = await prisma.officeTitle.findUnique({
      where: { id },
    });

    if (!officeTitle) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Office title not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Office title retrieved successfully',
      data: officeTitle,
    });
  } catch (err) {
    console.error('Get office title by id error:', err);
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
