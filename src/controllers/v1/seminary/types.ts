import type { z } from 'zod';
import type {
  getAllSeminaryApplicationsSchema,
  acceptSeminaryInstructorInviteSchema,
  bulkDeleteSeminaryStudentsSchema,
  bulkImportSeminaryStudentsSchema,
  createSeminaryAcademicYearSchema,
  createSeminaryApplicationSchema,
  createSeminaryAssignmentSchema,
  createSeminaryCourseSchema,
  createSeminaryExaminationSchema,
  createSeminaryGradeRecordSchema,
  createSeminaryInstructorSchema,
  createSeminaryStudyMaterialSchema,
  createSeminaryStudentSchema,
  deleteSeminaryAcademicYearSchema,
  deleteSeminaryAssignmentSchema,
  deleteSeminaryCourseSchema,
  deleteSeminaryExaminationSchema,
  deleteSeminaryGradeRecordSchema,
  deleteSeminaryInstructorSchema,
  deleteSeminaryStudyMaterialSchema,
  generateSeminaryCredentialDocumentSchema,
  getAllSeminaryAcademicYearsSchema,
  getAllSeminaryAssignmentsSchema,
  getAllSeminaryCoursesSchema,
  getAllSeminaryExaminationsSchema,
  getAllSeminaryGradeRecordsSchema,
  getAllSeminaryFeeCollectionsSchema,
  getAllSeminaryInstructorsSchema,
  getAllSeminaryStudyMaterialsSchema,
  getAllSeminaryStudentsSchema,
  getSeminaryCredentialDocumentByNumberSchema,
  getSeminaryCredentialDocumentsSchema,
  getSeminaryExaminationByIdSchema,
  getSeminaryGradeRecordSchema,
  inviteSeminaryInstructorSchema,
  updateSeminaryApplicationStatusSchema,
  updateSeminaryAcademicYearSchema,
  updateSeminaryAcademicYearSessionSchema,
  updateSeminaryAcademicYearStatusSchema,
  updateSeminaryAssignmentSchema,
  updateSeminaryAssignmentStatusSchema,
  updateSeminaryCourseSchema,
  updateSeminaryCourseStatusSchema,
  updateSeminaryExaminationSchema,
  updateSeminaryExaminationStatusSchema,
  updateSeminaryGradeRecordSchema,
  updateSeminaryGradeRecordStatusSchema,
  updateSeminaryGradeConfigurationSchema,
  updateSeminaryFeeConfigurationSchema,
  updateSeminaryFeeCollectionStatusSchema,
  updateSeminaryFeeCollectionPaymentSchema,
  updateSeminaryInstructorSchema,
  updateSeminaryInstructorStatusSchema,
  updateSeminaryStudyMaterialSchema,
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

export type GetAllSeminaryStudyMaterialsQuery = z.infer<
  typeof getAllSeminaryStudyMaterialsSchema
>['query'];

export type CreateSeminaryStudyMaterialBody = z.infer<
  typeof createSeminaryStudyMaterialSchema
>['body'];

export type UpdateSeminaryStudyMaterialBody = z.infer<
  typeof updateSeminaryStudyMaterialSchema
>['body'];

export type DeleteSeminaryStudyMaterialParams = z.infer<
  typeof deleteSeminaryStudyMaterialSchema
>['params'];

export type GetAllSeminaryAssignmentsQuery = z.infer<
  typeof getAllSeminaryAssignmentsSchema
>['query'];

export type CreateSeminaryAssignmentBody = z.infer<
  typeof createSeminaryAssignmentSchema
>['body'];

export type UpdateSeminaryAssignmentBody = z.infer<
  typeof updateSeminaryAssignmentSchema
>['body'];

export type UpdateSeminaryAssignmentStatusBody = z.infer<
  typeof updateSeminaryAssignmentStatusSchema
>['body'];

export type DeleteSeminaryAssignmentParams = z.infer<
  typeof deleteSeminaryAssignmentSchema
>['params'];

export type GetAllSeminaryExaminationsQuery = z.infer<
  typeof getAllSeminaryExaminationsSchema
>['query'];

export type GetSeminaryExaminationByIdParams = z.infer<
  typeof getSeminaryExaminationByIdSchema
>['params'];

export type CreateSeminaryExaminationBody = z.infer<
  typeof createSeminaryExaminationSchema
>['body'];

export type UpdateSeminaryExaminationBody = z.infer<
  typeof updateSeminaryExaminationSchema
>['body'];

export type UpdateSeminaryExaminationStatusBody = z.infer<
  typeof updateSeminaryExaminationStatusSchema
>['body'];

export type DeleteSeminaryExaminationParams = z.infer<
  typeof deleteSeminaryExaminationSchema
>['params'];

export type GetAllSeminaryGradeRecordsQuery = z.infer<
  typeof getAllSeminaryGradeRecordsSchema
>['query'];

export type GetSeminaryGradeRecordParams = z.infer<
  typeof getSeminaryGradeRecordSchema
>['params'];

export type CreateSeminaryGradeRecordBody = z.infer<
  typeof createSeminaryGradeRecordSchema
>['body'];

export type UpdateSeminaryGradeRecordBody = z.infer<
  typeof updateSeminaryGradeRecordSchema
>['body'];

export type UpdateSeminaryGradeRecordStatusBody = z.infer<
  typeof updateSeminaryGradeRecordStatusSchema
>['body'];

export type DeleteSeminaryGradeRecordParams = z.infer<
  typeof deleteSeminaryGradeRecordSchema
>['params'];

export type GetAllSeminaryInstructorsQuery = z.infer<
  typeof getAllSeminaryInstructorsSchema
>['query'];

export type CreateSeminaryInstructorBody = z.infer<
  typeof createSeminaryInstructorSchema
>['body'];

export type AcceptSeminaryInstructorInviteBody = z.infer<
  typeof acceptSeminaryInstructorInviteSchema
>['body'];

export type UpdateSeminaryInstructorBody = z.infer<
  typeof updateSeminaryInstructorSchema
>['body'];

export type UpdateSeminaryInstructorStatusBody = z.infer<
  typeof updateSeminaryInstructorStatusSchema
>['body'];

export type InviteSeminaryInstructorParams = z.infer<
  typeof inviteSeminaryInstructorSchema
>['params'];

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
