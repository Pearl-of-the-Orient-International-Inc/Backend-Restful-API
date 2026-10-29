import { HTTPSTATUS } from '@/common/http-codes';
import {
  SeminaryProgramLevel,
} from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import {
  buildFeeConfigurationCreateData,
  buildFeeConfigurationUpdateData,
} from './fee-configuration-shared';

import type { Request, Response } from 'express';
import type { UpdateSeminaryFeeConfigurationBody } from './types';

const getBreakdownTotal = (items: { amount: number }[]) =>
  items.reduce((sum, item) => sum + item.amount, 0);

export const updateSeminaryFeeConfiguration = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as UpdateSeminaryFeeConfigurationBody;
    const configuration = await prisma.$transaction(async (tx) => {
      const savedConfiguration = await tx.seminaryFeeConfiguration.upsert({
        where: { id: 'default' },
        create: buildFeeConfigurationCreateData(body),
        update: buildFeeConfigurationUpdateData(body),
      });
      const programTotals = {
        [SeminaryProgramLevel.CERTIFICATE]: getBreakdownTotal(
          body.feeBreakdowns.Certificate,
        ),
        [SeminaryProgramLevel.BACHELOR]: getBreakdownTotal(
          body.feeBreakdowns.Bachelor,
        ),
        [SeminaryProgramLevel.MASTER_WITH_THESIS]: getBreakdownTotal(
          body.feeBreakdowns.Masteral,
        ),
        [SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION]: getBreakdownTotal(
          body.feeBreakdowns.Doctorate,
        ),
      };

      await Promise.all(
        Object.entries(programTotals).map(([programLevel, totalCharges]) =>
          tx.seminaryFeeCollectionAccount.updateMany({
            where: { programLevel: programLevel as SeminaryProgramLevel },
            data: {
              totalCharges,
            },
          }),
        ),
      );

      const accounts = await tx.seminaryFeeCollectionAccount.findMany({
        select: {
          amountPaid: true,
          dueDate: true,
          id: true,
          totalCharges: true,
        },
      });

      await Promise.all(
        accounts.map((account) =>
          tx.seminaryFeeCollectionAccount.update({
            where: { id: account.id },
            data: (() => {
              const balance = Math.max(
                Number(account.totalCharges) - Number(account.amountPaid),
                0,
              );
              return {
                balance,
                status:
                  balance <= 0
                    ? 'PAID'
                    : Number(account.amountPaid) > 0
                      ? 'PARTIALLY_PAID'
                      : account.dueDate < new Date()
                        ? 'OVERDUE'
                        : 'PENDING',
              };
            })(),
          }),
        ),
      );

      return savedConfiguration;
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Seminary fee configuration updated successfully',
      data: configuration,
    });
  } catch (err) {
    logger.error('Error while updating seminary fee configuration', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
