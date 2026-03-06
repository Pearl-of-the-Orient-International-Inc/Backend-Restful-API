import config from '@/config';
import { UserType } from '@/generated/prisma/enums';

const removeTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

/**
 * Resolve verification redirect base URL by user role and environment.
 * Falls back to member dev URL when role-specific dev apps are not running.
 */
export const getVerificationBaseUrlByRole = (role: UserType): string => {
  const isProduction = config.NODE_ENV === 'production';

  if (isProduction) {
    if (role === UserType.ADMIN) {
      return removeTrailingSlash(config.VERIFY_REDIRECT_ADMIN_PROD);
    }

    if (role === UserType.OFFICER) {
      return removeTrailingSlash(config.VERIFY_REDIRECT_OFFICER_PROD);
    }

    return removeTrailingSlash(config.VERIFY_REDIRECT_MEMBER_PROD);
  }

  if (role === UserType.ADMIN) {
    return removeTrailingSlash(
      config.VERIFY_REDIRECT_ADMIN_DEV || config.VERIFY_REDIRECT_MEMBER_DEV,
    );
  }

  if (role === UserType.OFFICER) {
    return removeTrailingSlash(
      config.VERIFY_REDIRECT_OFFICER_DEV || config.VERIFY_REDIRECT_MEMBER_DEV,
    );
  }

  return removeTrailingSlash(config.VERIFY_REDIRECT_MEMBER_DEV);
};

export const buildVerificationUrl = (
  role: UserType,
  code: string | null,
): string => {
  if (!code) {
    throw new Error('Verification code is missing.');
  }

  return `${getVerificationBaseUrlByRole(role)}/confirm-account?token=${code}`;
};
