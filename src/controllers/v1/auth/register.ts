/**
 * Types
 */
import type { Request, Response } from 'express';

export const register = async (req: Request, res: Response): Promise<void> => {
  res.json(req.body);
};
