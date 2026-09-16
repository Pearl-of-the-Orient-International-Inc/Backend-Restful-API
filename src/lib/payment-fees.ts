import config from '@/config';
import { PaymentGateway } from '@/generated/prisma/enums';

export const paymentFeePolicies = {
  XENDIT: {
    percent: config.XENDIT_PLATFORM_FEE_PERCENT,
    fixed: config.XENDIT_PLATFORM_FEE_FIXED,
  },
  PAYPAL: {
    percent: config.PAYPAL_PLATFORM_FEE_PERCENT,
    fixed: config.PAYPAL_PLATFORM_FEE_FIXED,
  },
} satisfies Record<PaymentGateway, { percent: number; fixed: number }>;

export const calculatePlatformFee = (
  amount: number,
  gateway?: PaymentGateway | null,
) => {
  if (!gateway) return 0;
  const policy = paymentFeePolicies[gateway];
  return Number((amount * (policy.percent / 100) + policy.fixed).toFixed(2));
};
