/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { getCurrentSeminaryApplication } from '@/controllers/v1/seminary/get-current-seminary-application';
import { getCurrentSeminaryStudentNotifications } from '@/controllers/v1/seminary/get-current-seminary-student-notifications';
import { getCurrentStudentPortal } from '@/controllers/v1/seminary/get-current-student-portal';
import { upsertCurrentSeminaryApplication } from '@/controllers/v1/seminary/upsert-current-seminary-application';
import { getAllSeminaryApplications } from '@/controllers/v1/seminary/get-all-seminary-applications';
import { getSeminaryApplicationById } from '@/controllers/v1/seminary/get-seminary-application-by-id';
import { updateSeminaryApplicationStatus } from '@/controllers/v1/seminary/update-seminary-application-status';
import { bulkImportSeminaryStudents } from '@/controllers/v1/seminary/bulk-import-seminary-students';
import { bulkDeleteSeminaryStudents } from '@/controllers/v1/seminary/bulk-delete-seminary-students';
import { createSeminaryAcademicYear } from '@/controllers/v1/seminary/create-seminary-academic-year';
import { createSeminaryApplication } from '@/controllers/v1/seminary/create-seminary-application';
import { createSeminaryAssignment } from '@/controllers/v1/seminary/create-seminary-assignment';
import { createSeminaryCourse } from '@/controllers/v1/seminary/create-seminary-course';
import { createSeminaryExamination } from '@/controllers/v1/seminary/create-seminary-examination';
import { createSeminaryGradeRecord } from '@/controllers/v1/seminary/create-seminary-grade-record';
import { bulkEncodeSeminaryGrades } from '@/controllers/v1/seminary/bulk-encode-seminary-grades';
import { createSeminaryInstructor } from '@/controllers/v1/seminary/create-seminary-instructor';
import { createSeminaryStudyMaterial } from '@/controllers/v1/seminary/create-seminary-study-material';
import { createSeminaryStudent } from '@/controllers/v1/seminary/create-seminary-student';
import { changeSeminaryStudentPassword } from '@/controllers/v1/seminary/change-seminary-student-password';
import { deleteSeminaryAcademicYear } from '@/controllers/v1/seminary/delete-seminary-academic-year';
import { deleteSeminaryAssignment } from '@/controllers/v1/seminary/delete-seminary-assignment';
import { deleteSeminaryCourse } from '@/controllers/v1/seminary/delete-seminary-course';
import { deleteSeminaryExamination } from '@/controllers/v1/seminary/delete-seminary-examination';
import { deleteSeminaryGradeRecord } from '@/controllers/v1/seminary/delete-seminary-grade-record';
import { deleteSeminaryInstructor } from '@/controllers/v1/seminary/delete-seminary-instructor';
import { deleteSeminaryStudyMaterial } from '@/controllers/v1/seminary/delete-seminary-study-material';
import { deleteSeminaryStudent } from '@/controllers/v1/seminary/delete-seminary-student';
import { generateSeminaryCredentialDocument } from '@/controllers/v1/seminary/generate-seminary-credential-document';
import { getAllSeminaryAcademicYears } from '@/controllers/v1/seminary/get-all-seminary-academic-years';
import { getAllSeminaryAssignments } from '@/controllers/v1/seminary/get-all-seminary-assignments';
import { getAllSeminaryCourses } from '@/controllers/v1/seminary/get-all-seminary-courses';
import { getAllSeminaryExaminations } from '@/controllers/v1/seminary/get-all-seminary-examinations';
import { getAllSeminaryGradeRecords } from '@/controllers/v1/seminary/get-all-seminary-grade-records';
import { getAllSeminaryFeeCollections } from '@/controllers/v1/seminary/get-all-seminary-fee-collections';
import { getAllSeminaryInstructors } from '@/controllers/v1/seminary/get-all-seminary-instructors';
import { getAllSeminaryStudyMaterials } from '@/controllers/v1/seminary/get-all-seminary-study-materials';
import { getAllSeminaryStudents } from '@/controllers/v1/seminary/get-all-seminary-students';
import { getSeminaryFeeConfiguration } from '@/controllers/v1/seminary/get-seminary-fee-configuration';
import { getSeminaryGradeConfiguration } from '@/controllers/v1/seminary/get-seminary-grade-configuration';
import { getSeminaryGradeRecord } from '@/controllers/v1/seminary/get-seminary-grade-record';
import { getSeminaryCredentialDocumentByNumber } from '@/controllers/v1/seminary/get-seminary-credential-document-by-number';
import { getSeminaryCredentialDocuments } from '@/controllers/v1/seminary/get-seminary-credential-documents';
import { getSeminaryExaminationById } from '@/controllers/v1/seminary/get-seminary-examination-by-id';
import { getSeminaryInstructorById } from '@/controllers/v1/seminary/get-seminary-instructor-by-id';
import {
  acceptSeminaryInstructorInvite,
  inviteSeminaryInstructor,
} from '@/controllers/v1/seminary/instructor-invitation';
import { getSeminaryStudentById } from '@/controllers/v1/seminary/get-seminary-student-by-id';
import { getPublicSeminaryStudent } from '@/controllers/v1/seminary/get-public-seminary-student';
import { updateSeminaryAcademicYear } from '@/controllers/v1/seminary/update-seminary-academic-year';
import { updateSeminaryAcademicYearSession } from '@/controllers/v1/seminary/update-seminary-academic-year-session';
import { updateSeminaryAcademicYearStatus } from '@/controllers/v1/seminary/update-seminary-academic-year-status';
import { updateSeminaryAssignment } from '@/controllers/v1/seminary/update-seminary-assignment';
import { updateSeminaryAssignmentStatus } from '@/controllers/v1/seminary/update-seminary-assignment-status';
import { updateSeminaryCourse } from '@/controllers/v1/seminary/update-seminary-course';
import { updateSeminaryCourseStatus } from '@/controllers/v1/seminary/update-seminary-course-status';
import { updateSeminaryExamination } from '@/controllers/v1/seminary/update-seminary-examination';
import { updateSeminaryExaminationStatus } from '@/controllers/v1/seminary/update-seminary-examination-status';
import { updateSeminaryGradeRecord } from '@/controllers/v1/seminary/update-seminary-grade-record';
import { updateSeminaryGradeRecordStatus } from '@/controllers/v1/seminary/update-seminary-grade-record-status';
import { updateSeminaryFeeConfiguration } from '@/controllers/v1/seminary/update-seminary-fee-configuration';
import { updateSeminaryFeeCollectionStatus } from '@/controllers/v1/seminary/update-seminary-fee-collection-status';
import { updateSeminaryFeeCollectionPayment } from '@/controllers/v1/seminary/update-seminary-fee-collection-payment';
import { updateSeminaryGradeConfiguration } from '@/controllers/v1/seminary/update-seminary-grade-configuration';
import { updateSeminaryInstructor } from '@/controllers/v1/seminary/update-seminary-instructor';
import { updateSeminaryInstructorStatus } from '@/controllers/v1/seminary/update-seminary-instructor-status';
import { updateSeminaryStudyMaterial } from '@/controllers/v1/seminary/update-seminary-study-material';
import { updateSeminaryStudent } from '@/controllers/v1/seminary/update-seminary-student';
import { verifySeminaryCredentialDocument } from '@/controllers/v1/seminary/verify-seminary-credential-document';

/**
 * Helpers, Validators and Middlewares
 */
import { validate } from '@/common/sanitation';
import config from '@/config';
import { createUploadthingExpressHandler } from '@/lib/uploadthing';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { UserType } from '@/generated/prisma/enums';
import {
  bulkImportSeminaryStudentsSchema,
  createSeminaryAcademicYearSchema,
  createSeminaryApplicationSchema,
  createSeminaryAssignmentSchema,
  createSeminaryCourseSchema,
  createSeminaryExaminationSchema,
  createSeminaryGradeRecordSchema,
  bulkEncodeSeminaryGradesSchema,
  createSeminaryInstructorSchema,
  createSeminaryStudyMaterialSchema,
  acceptSeminaryInstructorInviteSchema,
  bulkDeleteSeminaryStudentsSchema,
  createSeminaryStudentSchema,
  changeSeminaryStudentPasswordSchema,
  deleteSeminaryAcademicYearSchema,
  deleteSeminaryAssignmentSchema,
  deleteSeminaryCourseSchema,
  deleteSeminaryExaminationSchema,
  deleteSeminaryGradeRecordSchema,
  deleteSeminaryInstructorSchema,
  deleteSeminaryStudyMaterialSchema,
  deleteSeminaryStudentSchema,
  generateSeminaryCredentialDocumentSchema,
  getAllSeminaryAcademicYearsSchema,
  getAllSeminaryAssignmentsSchema,
  getAllSeminaryApplicationsSchema,
  getAllSeminaryCoursesSchema,
  getAllSeminaryExaminationsSchema,
  getAllSeminaryGradeRecordsSchema,
  getAllSeminaryFeeCollectionsSchema,
  getAllSeminaryInstructorsSchema,
  getAllSeminaryStudyMaterialsSchema,
  getAllSeminaryStudentsSchema,
  getSeminaryCredentialDocumentByNumberSchema,
  getSeminaryCredentialDocumentsSchema,
  getSeminaryInstructorByIdSchema,
  getSeminaryExaminationByIdSchema,
  getSeminaryGradeRecordSchema,
  inviteSeminaryInstructorSchema,
  getSeminaryApplicationByIdSchema,
  getSeminaryStudentByIdSchema,
  getPublicSeminaryStudentSchema,
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
  updateSeminaryFeeConfigurationSchema,
  updateSeminaryFeeCollectionStatusSchema,
  updateSeminaryFeeCollectionPaymentSchema,
  updateSeminaryGradeConfigurationSchema,
  updateSeminaryInstructorSchema,
  updateSeminaryInstructorStatusSchema,
  updateSeminaryStudyMaterialSchema,
  updateSeminaryStudentSchema,
  upsertCurrentSeminaryApplicationSchema,
  verifySeminaryCredentialDocumentSchema,
} from '@/validators/seminary';

const router = Router();
const seminaryStudentAdminAccess = config.BYPASS_SEMINARY_STUDENT_AUTH
  ? []
  : [authenticate, authorize([UserType.ADMIN])];
const seminaryStudentReadAccess = config.BYPASS_SEMINARY_STUDENT_AUTH
  ? []
  : [authenticate, authorize([UserType.ADMIN, UserType.INSTRUCTOR])];
const seminaryStudyMaterialAccess = [
  authenticate,
  authorize([UserType.ADMIN, UserType.INSTRUCTOR]),
];
const seminaryAssignmentAccess = [
  authenticate,
  authorize([UserType.ADMIN, UserType.INSTRUCTOR]),
];
const seminaryExaminationAccess = [
  authenticate,
  authorize([UserType.ADMIN, UserType.INSTRUCTOR]),
];
const seminaryGradeRecordAccess = [
  authenticate,
  authorize([UserType.ADMIN, UserType.INSTRUCTOR]),
];

router.get(
  '/current/application',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  getCurrentSeminaryApplication,
);

router.get(
  '/current/student-notifications',
  expressRateLimit('basic'),
  authenticate,
  getCurrentSeminaryStudentNotifications,
);

router.get(
  '/current/student-portal',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  getCurrentStudentPortal,
);

router.put(
  '/current/application',
  expressRateLimit('basic'),
  validate(upsertCurrentSeminaryApplicationSchema),
  upsertCurrentSeminaryApplication,
);

router.use(
  '/requirements/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '16MB',
    maxFileCount: 1,
  }),
);

router.use(
  '/payment-receipts/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '8MB',
    maxFileCount: 1,
  }),
);

router.use(
  '/study-materials/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '32MB',
    maxFileCount: 1,
  }),
);

router.get(
  '/applications',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllSeminaryApplicationsSchema),
  getAllSeminaryApplications,
);

router.post(
  '/applications',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createSeminaryApplicationSchema),
  createSeminaryApplication,
);

router.get(
  '/applications/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getSeminaryApplicationByIdSchema),
  getSeminaryApplicationById,
);

router.patch(
  '/applications/:id/status',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateSeminaryApplicationStatusSchema),
  updateSeminaryApplicationStatus,
);

router.get(
  '/enrollments',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(getAllSeminaryApplicationsSchema),
  getAllSeminaryApplications,
);

router.patch(
  '/enrollments/:id/status',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryApplicationStatusSchema),
  updateSeminaryApplicationStatus,
);

router.get(
  '/instructors',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(getAllSeminaryInstructorsSchema),
  getAllSeminaryInstructors,
);

router.post(
  '/instructors/accept-invite',
  expressRateLimit('passwordReset'),
  validate(acceptSeminaryInstructorInviteSchema),
  acceptSeminaryInstructorInvite,
);

router.post(
  '/instructors',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(createSeminaryInstructorSchema),
  createSeminaryInstructor,
);

router.post(
  '/instructors/:id/invite',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(inviteSeminaryInstructorSchema),
  inviteSeminaryInstructor,
);

router.get(
  '/instructors/:id',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(getSeminaryInstructorByIdSchema),
  getSeminaryInstructorById,
);

router.put(
  '/instructors/:id',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryInstructorSchema),
  updateSeminaryInstructor,
);

router.patch(
  '/instructors/:id/status',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryInstructorStatusSchema),
  updateSeminaryInstructorStatus,
);

router.delete(
  '/instructors/:id',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(deleteSeminaryInstructorSchema),
  deleteSeminaryInstructor,
);

router.get(
  '/students',
  expressRateLimit('basic'),
  ...seminaryStudentReadAccess,
  validate(getAllSeminaryStudentsSchema),
  getAllSeminaryStudents,
);

router.get(
  '/public/students/:studentId',
  expressRateLimit('basic'),
  validate(getPublicSeminaryStudentSchema),
  getPublicSeminaryStudent,
);

router.post(
  '/students',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(createSeminaryStudentSchema),
  createSeminaryStudent,
);

router.patch(
  '/students/:studentId/password',
  expressRateLimit('passwordReset'),
  ...seminaryStudentAdminAccess,
  validate(changeSeminaryStudentPasswordSchema),
  changeSeminaryStudentPassword,
);

router.post(
  '/students/bulk-import',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(bulkImportSeminaryStudentsSchema),
  bulkImportSeminaryStudents,
);

router.delete(
  '/students/bulk-delete',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(bulkDeleteSeminaryStudentsSchema),
  bulkDeleteSeminaryStudents,
);

router.get(
  '/courses',
  expressRateLimit('basic'),
  ...seminaryStudentReadAccess,
  validate(getAllSeminaryCoursesSchema),
  getAllSeminaryCourses,
);

router.post(
  '/courses',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(createSeminaryCourseSchema),
  createSeminaryCourse,
);

router.put(
  '/courses/:id',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryCourseSchema),
  updateSeminaryCourse,
);

router.patch(
  '/courses/:id/status',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryCourseStatusSchema),
  updateSeminaryCourseStatus,
);

router.delete(
  '/courses/:id',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(deleteSeminaryCourseSchema),
  deleteSeminaryCourse,
);

router.get(
  '/study-materials',
  expressRateLimit('basic'),
  ...seminaryStudyMaterialAccess,
  validate(getAllSeminaryStudyMaterialsSchema),
  getAllSeminaryStudyMaterials,
);

router.post(
  '/study-materials',
  expressRateLimit('basic'),
  ...seminaryStudyMaterialAccess,
  validate(createSeminaryStudyMaterialSchema),
  createSeminaryStudyMaterial,
);

router.put(
  '/study-materials/:id',
  expressRateLimit('basic'),
  ...seminaryStudyMaterialAccess,
  validate(updateSeminaryStudyMaterialSchema),
  updateSeminaryStudyMaterial,
);

router.delete(
  '/study-materials/:id',
  expressRateLimit('basic'),
  ...seminaryStudyMaterialAccess,
  validate(deleteSeminaryStudyMaterialSchema),
  deleteSeminaryStudyMaterial,
);

router.get(
  '/assignments',
  expressRateLimit('basic'),
  ...seminaryAssignmentAccess,
  validate(getAllSeminaryAssignmentsSchema),
  getAllSeminaryAssignments,
);

router.post(
  '/assignments',
  expressRateLimit('basic'),
  ...seminaryAssignmentAccess,
  validate(createSeminaryAssignmentSchema),
  createSeminaryAssignment,
);

router.put(
  '/assignments/:id',
  expressRateLimit('basic'),
  ...seminaryAssignmentAccess,
  validate(updateSeminaryAssignmentSchema),
  updateSeminaryAssignment,
);

router.patch(
  '/assignments/:id/status',
  expressRateLimit('basic'),
  ...seminaryAssignmentAccess,
  validate(updateSeminaryAssignmentStatusSchema),
  updateSeminaryAssignmentStatus,
);

router.delete(
  '/assignments/:id',
  expressRateLimit('basic'),
  ...seminaryAssignmentAccess,
  validate(deleteSeminaryAssignmentSchema),
  deleteSeminaryAssignment,
);

router.get(
  '/examinations',
  expressRateLimit('basic'),
  ...seminaryExaminationAccess,
  validate(getAllSeminaryExaminationsSchema),
  getAllSeminaryExaminations,
);

router.post(
  '/examinations',
  expressRateLimit('basic'),
  ...seminaryExaminationAccess,
  validate(createSeminaryExaminationSchema),
  createSeminaryExamination,
);

router.get(
  '/examinations/:id',
  expressRateLimit('basic'),
  ...seminaryExaminationAccess,
  validate(getSeminaryExaminationByIdSchema),
  getSeminaryExaminationById,
);

router.put(
  '/examinations/:id',
  expressRateLimit('basic'),
  ...seminaryExaminationAccess,
  validate(updateSeminaryExaminationSchema),
  updateSeminaryExamination,
);

router.patch(
  '/examinations/:id/status',
  expressRateLimit('basic'),
  ...seminaryExaminationAccess,
  validate(updateSeminaryExaminationStatusSchema),
  updateSeminaryExaminationStatus,
);

router.delete(
  '/examinations/:id',
  expressRateLimit('basic'),
  ...seminaryExaminationAccess,
  validate(deleteSeminaryExaminationSchema),
  deleteSeminaryExamination,
);

router.get(
  '/academic-years',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(getAllSeminaryAcademicYearsSchema),
  getAllSeminaryAcademicYears,
);

router.post(
  '/academic-years',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(createSeminaryAcademicYearSchema),
  createSeminaryAcademicYear,
);

router.put(
  '/academic-years/:id',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryAcademicYearSchema),
  updateSeminaryAcademicYear,
);

router.patch(
  '/academic-years/:id/session',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryAcademicYearSessionSchema),
  updateSeminaryAcademicYearSession,
);

router.patch(
  '/academic-years/:id/status',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryAcademicYearStatusSchema),
  updateSeminaryAcademicYearStatus,
);

router.delete(
  '/academic-years/:id',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(deleteSeminaryAcademicYearSchema),
  deleteSeminaryAcademicYear,
);

router.get(
  '/grade-configuration',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  getSeminaryGradeConfiguration,
);

router.put(
  '/grade-configuration',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryGradeConfigurationSchema),
  updateSeminaryGradeConfiguration,
);

router.get(
  '/grade-records',
  expressRateLimit('basic'),
  ...seminaryGradeRecordAccess,
  validate(getAllSeminaryGradeRecordsSchema),
  getAllSeminaryGradeRecords,
);

router.post(
  '/grade-records/encode',
  expressRateLimit('basic'),
  ...seminaryGradeRecordAccess,
  validate(bulkEncodeSeminaryGradesSchema),
  bulkEncodeSeminaryGrades,
);

router.post(
  '/grade-records',
  expressRateLimit('basic'),
  ...seminaryGradeRecordAccess,
  validate(createSeminaryGradeRecordSchema),
  createSeminaryGradeRecord,
);

router.get(
  '/grade-records/:id',
  expressRateLimit('basic'),
  ...seminaryGradeRecordAccess,
  validate(getSeminaryGradeRecordSchema),
  getSeminaryGradeRecord,
);

router.put(
  '/grade-records/:id',
  expressRateLimit('basic'),
  ...seminaryGradeRecordAccess,
  validate(updateSeminaryGradeRecordSchema),
  updateSeminaryGradeRecord,
);

router.patch(
  '/grade-records/:id/status',
  expressRateLimit('basic'),
  ...seminaryGradeRecordAccess,
  validate(updateSeminaryGradeRecordStatusSchema),
  updateSeminaryGradeRecordStatus,
);

router.delete(
  '/grade-records/:id',
  expressRateLimit('basic'),
  ...seminaryGradeRecordAccess,
  validate(deleteSeminaryGradeRecordSchema),
  deleteSeminaryGradeRecord,
);

router.get(
  '/fee-configuration',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  getSeminaryFeeConfiguration,
);

router.put(
  '/fee-configuration',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryFeeConfigurationSchema),
  updateSeminaryFeeConfiguration,
);

router.get(
  '/fee-collections',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(getAllSeminaryFeeCollectionsSchema),
  getAllSeminaryFeeCollections,
);

router.patch(
  '/fee-collections/:id/status',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryFeeCollectionStatusSchema),
  updateSeminaryFeeCollectionStatus,
);

router.patch(
  '/fee-collections/:id/payment',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryFeeCollectionPaymentSchema),
  updateSeminaryFeeCollectionPayment,
);

router.get(
  '/credential-documents/verify/:token',
  expressRateLimit('basic'),
  validate(verifySeminaryCredentialDocumentSchema),
  verifySeminaryCredentialDocument,
);

router.get(
  '/credential-documents/:documentNumber',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(getSeminaryCredentialDocumentByNumberSchema),
  getSeminaryCredentialDocumentByNumber,
);

router.get(
  '/students/:studentId/credential-documents',
  expressRateLimit('basic'),
  ...seminaryStudentReadAccess,
  validate(getSeminaryCredentialDocumentsSchema),
  getSeminaryCredentialDocuments,
);

router.post(
  '/students/:studentId/credential-documents',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(generateSeminaryCredentialDocumentSchema),
  generateSeminaryCredentialDocument,
);

router.get(
  '/students/:studentId',
  expressRateLimit('basic'),
  ...seminaryStudentReadAccess,
  validate(getSeminaryStudentByIdSchema),
  getSeminaryStudentById,
);

router.put(
  '/students/:studentId',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(updateSeminaryStudentSchema),
  updateSeminaryStudent,
);

router.delete(
  '/students/:studentId',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(deleteSeminaryStudentSchema),
  deleteSeminaryStudent,
);

export default router;
