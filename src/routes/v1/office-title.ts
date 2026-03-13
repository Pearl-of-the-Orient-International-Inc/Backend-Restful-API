import { Router } from 'express';
import { getOfficeTitleById } from '@/controllers/v1/office-title/get-office-title-by-id';
import { authenticate } from '@/middlewares/authentication';
import { officeTitleIdParamSchema } from '@/validators/office-title';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

const validateOfficeTitleIdParam = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const result = officeTitleIdParamSchema.safeParse(req.params);

  if (!result.success) {
    const issues = result.error.issues;
    res.status(400).json({
      code: 'BAD_REQUEST',
      message: issues[0]?.message ?? 'Invalid ID parameter',
      errors: issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  next();
};

router.get('/:id', authenticate, validateOfficeTitleIdParam, getOfficeTitleById);

export default router;
