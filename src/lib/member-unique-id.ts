import { UserType } from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

const MEMBER_ROLE_DIGIT = '2';
const OFFICER_ROLE_DIGIT = '1';
const RESERVED_MEMBER_PREFIX = '262';
const RESERVED_MEMBER_MIN_SERIES = 36;

const getRoleDigit = (role: UserType): string =>
  role === UserType.OFFICER ? OFFICER_ROLE_DIGIT : MEMBER_ROLE_DIGIT;

const getYearTwoDigits = (date: Date): string =>
  String(date.getFullYear()).slice(-2);

const parseSeries = (uniqueId: string): number => {
  const match = uniqueId.match(/^\d{3}-(\d{5})$/);
  if (!match) return 0;
  return Number.parseInt(match[1], 10) || 0;
};

const getBaselineSeries = (prefix: string): number => {
  // Member IDs for the 26/2 prefix must continue from 262-00037 onward.
  // Officer IDs keep their own prefix and are not forced into the member baseline.
  if (prefix === RESERVED_MEMBER_PREFIX) {
    return RESERVED_MEMBER_MIN_SERIES;
  }

  return 0;
};

export const generateNextMemberUniqueId = async (
  role: UserType,
  db: Prisma.TransactionClient | typeof prisma = prisma,
  now: Date = new Date(),
): Promise<string> => {
  const prefix = `${getYearTwoDigits(now)}${getRoleDigit(role)}`;
  const existing = await db.member.findFirst({
    where: {
      uniqueId: {
        startsWith: `${prefix}-`,
      },
    },
    orderBy: {
      uniqueId: 'desc',
    },
    select: {
      uniqueId: true,
    },
  });

  const baselineSeries = getBaselineSeries(prefix);
  const maxExistingSeries = existing?.uniqueId ? parseSeries(existing.uniqueId) : 0;
  const nextSeries = Math.max(maxExistingSeries, baselineSeries) + 1;
  const paddedSeries = String(nextSeries).padStart(5, '0');

  return `${prefix}-${paddedSeries}`;
};
