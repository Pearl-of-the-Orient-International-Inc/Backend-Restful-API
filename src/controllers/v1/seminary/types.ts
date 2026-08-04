import type { z } from 'zod';
import type {
  getAllSeminaryApplicationsSchema,
  bulkDeleteSeminaryStudentsSchema,
  bulkImportSeminaryStudentsSchema,
  createSeminaryAcademicYearSchema,
  createSeminaryApplicationSchema,
  createSeminaryCourseSchema,
  createSeminaryInstructorSchema,
  createSeminaryStudentSchema,
  deleteSeminaryAcademicYearSchema,
  deleteSeminaryCourseSchema,
  deleteSeminaryInstructorSchema,
  generateSeminaryCredentialDocumentSchema,
  getAllSeminaryAcademicYearsSchema,
  getAllSeminaryCoursesSchema,
  getAllSeminaryFeeCollectionsSchema,
  getAllSeminaryInstructorsSchema,
  getAllSeminaryStudentsSchema,
  getSeminaryCredentialDocumentByNumberSchema,
  getSeminaryCredentialDocumentsSchema,
  updateSeminaryApplicationStatusSchema,
  updateSeminaryAcademicYearSchema,
  updateSeminaryAcademicYearSessionSchema,
  updateSeminaryAcademicYearStatusSchema,
  updateSeminaryCourseSchema,
  updateSeminaryCourseStatusSchema,
  updateSeminaryGradeConfigurationSchema,
  updateSeminaryFeeConfigurationSchema,
  updateSeminaryFeeCollectionStatusSchema,
  updateSeminaryFeeCollectionPaymentSchema,
  updateSeminaryInstructorSchema,
  updateSeminaryInstructorStatusSchema,
  updateSeminaryStudentSchema,
  upsertCurrentSeminaryApplicationSchema,
  verifySeminaryCredentialDocumentSchema,
} from '@/validators/seminary';

export type UpsertCurrentSeminaryApplicationBody = z.infer<
  typeof upsertCurrentSeminaryApplicationSchema
>;

export type CreateSeminaryApplicationBody = z.infer<
  typeof createSeminaryApplicationSchema
>['body'];

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

export type BulkDeleteSeminaryStudentsBody = z.infer<
  typeof bulkDeleteSeminaryStudentsSchema
>['body'];

export type GetAllSeminaryAcademicYearsQuery = z.infer<
  typeof getAllSeminaryAcademicYearsSchema
>['query'];

export type CreateSeminaryAcademicYearBody = z.infer<
  typeof createSeminaryAcademicYearSchema
>['body'];

export type UpdateSeminaryAcademicYearBody = z.infer<
  typeof updateSeminaryAcademicYearSchema
>['body'];

export type UpdateSeminaryAcademicYearSessionBody = z.infer<
  typeof updateSeminaryAcademicYearSessionSchema
>['body'];

export type UpdateSeminaryAcademicYearStatusBody = z.infer<
  typeof updateSeminaryAcademicYearStatusSchema
>['body'];

export type DeleteSeminaryAcademicYearParams = z.infer<
  typeof deleteSeminaryAcademicYearSchema
>['params'];

export type UpdateSeminaryGradeConfigurationBody = z.infer<
  typeof updateSeminaryGradeConfigurationSchema
>['body'];

export type UpdateSeminaryFeeConfigurationBody = z.infer<
  typeof updateSeminaryFeeConfigurationSchema
>['body'];

export type GetAllSeminaryFeeCollectionsQuery = z.infer<
  typeof getAllSeminaryFeeCollectionsSchema
>['query'];

export type UpdateSeminaryFeeCollectionStatusBody = z.infer<
  typeof updateSeminaryFeeCollectionStatusSchema
>['body'];

export type UpdateSeminaryFeeCollectionPaymentBody = z.infer<
  typeof updateSeminaryFeeCollectionPaymentSchema
>['body'];

export type GetAllSeminaryCoursesQuery = z.infer<
  typeof getAllSeminaryCoursesSchema
>['query'];

export type CreateSeminaryCourseBody = z.infer<
  typeof createSeminaryCourseSchema
>['body'];

export type UpdateSeminaryCourseBody = z.infer<
  typeof updateSeminaryCourseSchema
>['body'];

export type UpdateSeminaryCourseStatusBody = z.infer<
  typeof updateSeminaryCourseStatusSchema
>['body'];

export type DeleteSeminaryCourseParams = z.infer<
  typeof deleteSeminaryCourseSchema
>['params'];

export type GetAllSeminaryInstructorsQuery = z.infer<
  typeof getAllSeminaryInstructorsSchema
>['query'];

export type CreateSeminaryInstructorBody = z.infer<
  typeof createSeminaryInstructorSchema
>['body'];

export type UpdateSeminaryInstructorBody = z.infer<
  typeof updateSeminaryInstructorSchema
>['body'];

export type UpdateSeminaryInstructorStatusBody = z.infer<
  typeof updateSeminaryInstructorStatusSchema
>['body'];

export type DeleteSeminaryInstructorParams = z.infer<
  typeof deleteSeminaryInstructorSchema
>['params'];

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
