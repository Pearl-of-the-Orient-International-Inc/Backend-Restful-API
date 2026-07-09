import type { z } from 'zod';
import type {
  getAllSeminaryApplicationsSchema,
  bulkImportSeminaryStudentsSchema,
  createSeminaryStudentSchema,
  generateSeminaryCredentialDocumentSchema,
  getAllSeminaryStudentsSchema,
  getSeminaryCredentialDocumentByNumberSchema,
  getSeminaryCredentialDocumentsSchema,
  updateSeminaryApplicationStatusSchema,
  updateSeminaryStudentSchema,
  upsertCurrentSeminaryApplicationSchema,
  verifySeminaryCredentialDocumentSchema,
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

export type CreateSeminaryStudentBody = z.infer<
  typeof createSeminaryStudentSchema
>['body'];

export type UpdateSeminaryStudentBody = z.infer<
  typeof updateSeminaryStudentSchema
>['body'];

export type GetAllSeminaryStudentsQuery = z.infer<
  typeof getAllSeminaryStudentsSchema
>['query'];

export type BulkImportSeminaryStudentsBody = z.infer<
  typeof bulkImportSeminaryStudentsSchema
>['body'];

export type GenerateSeminaryCredentialDocumentBody = z.infer<
  typeof generateSeminaryCredentialDocumentSchema
>['body'];

export type GetSeminaryCredentialDocumentsQuery = z.infer<
  typeof getSeminaryCredentialDocumentsSchema
>['query'];

export type GetSeminaryCredentialDocumentByNumberParams = z.infer<
  typeof getSeminaryCredentialDocumentByNumberSchema
>['params'];

export type VerifySeminaryCredentialDocumentParams = z.infer<
  typeof verifySeminaryCredentialDocumentSchema
>['params'];
