import { Prisma } from '@/generated/prisma/client';
import {
  SeminaryFeeCollectionStatus,
  SeminaryProgramLevel,
} from '@/generated/prisma/enums';

const decimalToNumber = (value: Prisma.Decimal | number | string) =>
  Number(value.toString());

export const feeCollectionStatusLabels = {
  [SeminaryFeeCollectionStatus.PENDING]: 'Pending',
  [SeminaryFeeCollectionStatus.PARTIALLY_PAID]: 'Partially Paid',
  [SeminaryFeeCollectionStatus.PAID]: 'Paid',
  [SeminaryFeeCollectionStatus.OVERDUE]: 'Overdue',
} as const;

export const feeCollectionProgramLabels = {
  [SeminaryProgramLevel.CERTIFICATE]: 'Certificate',
  [SeminaryProgramLevel.BACHELOR]: 'Bachelor',
  [SeminaryProgramLevel.MASTER_WITH_THESIS]: 'Masteral',
  [SeminaryProgramLevel.DOCTORATE_WITH_DISSERTATION]: 'Doctorate',
} as const;

export const normalizeFeeCollectionStatus = (
  status: string,
): SeminaryFeeCollectionStatus =>
  (
    {
      Pending: SeminaryFeeCollectionStatus.PENDING,
      PENDING: SeminaryFeeCollectionStatus.PENDING,
      'Partially Paid': SeminaryFeeCollectionStatus.PARTIALLY_PAID,
      PARTIALLY_PAID: SeminaryFeeCollectionStatus.PARTIALLY_PAID,
      Paid: SeminaryFeeCollectionStatus.PAID,
      PAID: SeminaryFeeCollectionStatus.PAID,
      Overdue: SeminaryFeeCollectionStatus.OVERDUE,
      OVERDUE: SeminaryFeeCollectionStatus.OVERDUE,
    } as Record<string, SeminaryFeeCollectionStatus>
  )[status] ?? SeminaryFeeCollectionStatus.PENDING;

export const toFeeCollectionResponse = (
  account: Prisma.SeminaryFeeCollectionAccountGetPayload<object>,
) => ({
  ...account,
  amountPaid: decimalToNumber(account.amountPaid),
  balance: decimalToNumber(account.balance),
  programLevelLabel: feeCollectionProgramLabels[account.programLevel],
  statusLabel: feeCollectionStatusLabels[account.status],
  totalCharges: decimalToNumber(account.totalCharges),
});
