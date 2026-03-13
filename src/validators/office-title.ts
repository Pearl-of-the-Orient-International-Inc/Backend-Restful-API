import { z } from 'zod';

export const officeTitleIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid office title ID: must be a valid UUID' }),
});

export type OfficeTitleIdParam = z.infer<typeof officeTitleIdParamSchema>;
