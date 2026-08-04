import type { Prisma } from '@/generated/prisma/client';
import type { UpdateSeminaryFeeConfigurationBody } from './types';

export const defaultFeeBreakdowns = {
  Certificate: [
    { label: 'Registration Fee', amount: 500 },
    { label: 'Tuition Fee', amount: 3000 },
    { label: 'School Uniform', amount: 900 },
    { label: 'Graduation Fee', amount: 5000 },
    { label: 'Google Meet Subscription', amount: 100 },
  ],
  Bachelor: [
    { label: 'Registration Fee', amount: 1000 },
    { label: 'Tuition Fee', amount: 30000 },
    { label: 'Miscellaneous Fee', amount: 2000 },
    { label: 'Graduation Fee', amount: 8000 },
  ],
  Masteral: [
    { label: 'Registration Fee', amount: 1000 },
    { label: 'Tuition Fee', amount: 30000 },
    { label: 'Miscellaneous Fee', amount: 2000 },
    { label: 'Graduation Fee', amount: 8000 },
  ],
  Doctorate: [
    { label: 'Registration Fee', amount: 1000 },
    { label: 'Tuition Fee', amount: 40000 },
    { label: 'Miscellaneous Fee', amount: 2000 },
    { label: 'Graduation Fee', amount: 8000 },
  ],
};

export const defaultFeeConfiguration = {
  id: 'default',
  feeBreakdowns: defaultFeeBreakdowns,
} satisfies Prisma.SeminaryFeeConfigurationUncheckedCreateInput;

export const buildFeeConfigurationCreateData = (
  body: UpdateSeminaryFeeConfigurationBody,
): Prisma.SeminaryFeeConfigurationUncheckedCreateInput => ({
  id: 'default',
  feeBreakdowns: body.feeBreakdowns,
});

export const buildFeeConfigurationUpdateData = (
  body: UpdateSeminaryFeeConfigurationBody,
): Prisma.SeminaryFeeConfigurationUncheckedUpdateInput => ({
  feeBreakdowns: body.feeBreakdowns,
});
