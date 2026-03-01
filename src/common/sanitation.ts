import { HTTPSTATUS } from '@/common/http-codes';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        ...req.body,
        ...req.query // i added this sir to make sure po na magamit ang generic validation.
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          errors: formattedErrors,
        });
      }
    }
  };
};
