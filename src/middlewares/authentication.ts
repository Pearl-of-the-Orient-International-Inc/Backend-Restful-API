/**
 * Node Modules
 */
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * Custom Modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { verifyAccessToken } from '@/lib/jwt';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response, NextFunction } from 'express';

/**
 * @function authenticate
 * @description Middleware to verify the user's access token from the Authorization header.
 * 				If the token is valid, the user's ID is attached to the request object.
 * 				Otherwise, it returns an appropriate error response.
 *
 * @param {Request} req - Express request object. Expects a Bearer token in the Authorization header.
 * @param {Response} res - Express response object used to send error responses if authentication fails.
 * @param {NextFunction} next - Express next function to pass control to the next middleware.
 *
 * @returns {void}
 */

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  // If there's no Bearer token, respond with 401.
  if (!authHeader?.startsWith('Bearer ')) {
    logger.error('Access denied, no token provided');
    res.status(HTTPSTATUS.UNAUTHORIZED).json({
      code: 'UNAUTHORIZED',
      message: 'Access denied, no token provided',
    });
    return;
  }

  // Split out the token from the Bearer prefix
  const [_, token] = authHeader.split(' ');

  try {
    // Verify the token and extract the userId from the payload
    const jwtPayload = verifyAccessToken(token) as { userId: string };

    // Attach the userId to the request object for later use
    req.userId = jwtPayload.userId;

    return next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Access token expired, request a new one with refresh token',
      });
      return;
    }

    if (err instanceof JsonWebTokenError) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid access token',
      });
      return;
    }

    logger.error('Error during authentication', { error: err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
