import { HTTPSTATUS } from '@/common/http-codes';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const body =
        req.body && typeof req.body === 'object' && !Array.isArray(req.body)
          ? req.body
          : {};

      const payload =
        req.method === 'GET'
          ? { query: req.query, params: req.params }
          : {
              ...body,
              body: req.body,
              query: req.query,
              params: req.params,
            };

      schema.parse(payload);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
    }
  };
};
