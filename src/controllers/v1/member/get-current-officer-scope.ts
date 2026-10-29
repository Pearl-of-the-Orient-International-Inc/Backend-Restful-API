import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { getOfficerScope } from '@/lib/officer-scope';

export const getCurrentOfficerScope = async (req: Request, res: Response): Promise<void> => {
  const scope = req.userId ? await getOfficerScope(req.userId) : null;
  if (!scope) {
    res.status(HTTPSTATUS.FORBIDDEN).json({ code: 'FORBIDDEN', message: 'An active officer assignment is required' });
    return;
  }
  res.status(HTTPSTATUS.OK).json({
    code: 'OK',
    message: 'Officer scope retrieved successfully',
    data: { memberId: scope.memberId, assignments: scope.assignments },
  });
};

