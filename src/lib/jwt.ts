/**
 * Node Modules
 */
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

/**
 * Custom Modules
 */
import config from '@/config';

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

/**
 * Generates a JWT access token with a 1-hour expiration.
 *
 * - Signs the provided payload using the configured access token secret.
 */
export const generateAccessToken = (userId: string): string => {
  const token = jwt.sign({ userId }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  });

  return token;
};

/**
 * Generates a JWT refresh token with a 1-hour expiration.
 *
 * - Signs the provided payload using the configured refresh token secret.
 */
export const generateRefreshToken = (
  userId: string,
  sessionId: string,
): string => {
  const token = jwt.sign({ userId, sessionId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });

  return token;
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, config.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (
  token: string,
): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      config.JWT_REFRESH_SECRET,
    ) as jwt.JwtPayload & RefreshTokenPayload;
    if (decoded?.userId && decoded?.sessionId) {
      return { userId: decoded.userId, sessionId: decoded.sessionId };
    }
    return null;
  } catch {
    return null;
  }
};
