import type { z } from 'zod';
import type {
  getAllSeminaryApplicationsSchema,
  updateSeminaryApplicationStatusSchema,
  upsertCurrentSeminaryApplicationSchema,
} from '@/validators/seminary';

export type UpsertCurrentSeminaryApplicationBody = z.infer<
  typeof upsertCurrentSeminaryApplicationSchema
>;

export type GetAllSeminaryApplicationsQuery = z.infer<
  typeof getAllSeminaryApplicationsSchema
>['query'];

export type UpdateSeminaryApplicationStatusBody = z.infer<
  typeof updateSeminaryApplicationStatusSchema
>['body'];
