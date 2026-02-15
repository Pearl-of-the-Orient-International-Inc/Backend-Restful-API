/**
 *
 * @copyright 2025 kylemastercoder
 * @license Apache-2.0
 */

/**
 * Custom Modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { UserType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response, NextFunction } from 'express';

/**
 * @function authorize
 * @description Middleware to check if the authenticated user has one of the required roles.
 *              This middleware must be used after the authenticate middleware, which sets req.userId.
 *              It fetches the user from the database and verifies their role matches the allowed roles.
 *              If the user doesn't have the required role, returns a 403 Forbidden response.
 *
 * @param {UserType[]} roles - Array of allowed user roles (e.g., [UserType.ADMIN, UserType.CUSTOMER])
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Allow only admins
 * router.get('/admin-only', authenticate, authorize([UserType.ADMIN]), controller);
 *
 * // Allow both admins and customers
 * router.get('/users', authenticate, authorize([UserType.ADMIN, UserType.CUSTOMER]), controller);
 */

const authorize = (roles: UserType[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const userId = req.userId;

    if (!userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        });
        return;
      }

      if (!roles.includes(user.role)) {
        res.status(HTTPSTATUS.FORBIDDEN).json({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        });
        return;
      }

      return next();
    } catch (err) {
      logger.error('Error in authorize middleware', { err, userId });
      res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        error: err,
      });
    }
  };
};

export default authorize;
