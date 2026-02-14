import type { User as PrismaUser } from '../../generated/prisma';
import * as express from 'express';

declare global {
  namespace Express {
    /** User attached to req.user by JWT strategy (Prisma User, password omitted) */
    interface User extends Omit<PrismaUser, 'password'> {}
    interface Request {
      sessionId?: string;
      userId?: string;
    }
  }
}
