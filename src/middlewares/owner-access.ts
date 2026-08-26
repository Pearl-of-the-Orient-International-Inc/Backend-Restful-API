import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import config from '@/config';

const OWNER_SESSION_TTL_MS = 10 * 60 * 1000;

type OwnerAccessTokenPayload = jwt.JwtPayload & {
  ownerAccess: true;
};

export const getOwnerSessionCookieName = () => config.OWNER_SESSION_COOKIE_NAME;

export const getOwnerSessionCookieOptions = () => ({
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: OWNER_SESSION_TTL_MS,
  path: '/api/v1/owner',
});

export const createOwnerSessionToken = () =>
  jwt.sign({ ownerAccess: true }, config.JWT_ACCESS_SECRET, {
    expiresIn: '10m',
  });

export const verifyOwnerSessionToken = (
  token: string | undefined,
): OwnerAccessTokenPayload | null => {
  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      config.JWT_ACCESS_SECRET,
    ) as OwnerAccessTokenPayload;

    return decoded.ownerAccess === true ? decoded : null;
  } catch {
    return null;
  }
};

export const setOwnerSessionCookie = (res: Response) => {
  res.cookie(
    getOwnerSessionCookieName(),
    createOwnerSessionToken(),
    getOwnerSessionCookieOptions(),
  );
};

export const clearOwnerSessionCookie = (res: Response) => {
  res.clearCookie(getOwnerSessionCookieName(), {
    ...getOwnerSessionCookieOptions(),
    maxAge: undefined,
  });
};

export const authenticateOwnerAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.[getOwnerSessionCookieName()] as
    | string
    | undefined;
  const payload = verifyOwnerSessionToken(token);

  if (!payload) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({
      code: 'UNAUTHORIZED',
      message: 'Owner PIN session expired. Enter PIN again.',
    });
    return;
  }

  next();
};
