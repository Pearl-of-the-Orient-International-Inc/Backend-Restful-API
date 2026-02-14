/**
 * Custom Modules
 */
import { verifyRefreshToken } from '@/lib/jwt';

/**
 * Types
 */
import type { Request, Response, NextFunction } from 'express';

export const getSessionFromCookie = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    console.log('🔍 Checking for refresh token:', {
      hasCookie: !!refreshToken,
      cookies: Object.keys(req.cookies || {}),
    });

    if (!refreshToken) {
      console.log('⚠️ No refresh token found in cookies');
      return next();
    }

    const payload = verifyRefreshToken(refreshToken);

    console.log('🔓 Token payload:', payload);

    if (payload?.sessionId) {
      req.sessionId = payload.sessionId;
      console.log('✅ Session ID set:', req.sessionId);
    } else {
      console.log('⚠️ No sessionId in token payload');
    }

    next();
  } catch (error) {
    console.error('❌ Error verifying refresh token:', error);
    // Don't throw error, just proceed without session
    next();
  }
};
