/**
 * Node Modules
 */
import { Router } from 'express';

/**
 * Controllers
 */
import { getCurrentSeminaryApplication } from '@/controllers/v1/seminary/get-current-seminary-application';
import { upsertCurrentSeminaryApplication } from '@/controllers/v1/seminary/upsert-current-seminary-application';
import { getAllSeminaryApplications } from '@/controllers/v1/seminary/get-all-seminary-applications';
import { getSeminaryApplicationById } from '@/controllers/v1/seminary/get-seminary-application-by-id';
import { updateSeminaryApplicationStatus } from '@/controllers/v1/seminary/update-seminary-application-status';
import { bulkImportSeminaryStudents } from '@/controllers/v1/seminary/bulk-import-seminary-students';
import { bulkDeleteSeminaryStudents } from '@/controllers/v1/seminary/bulk-delete-seminary-students';
import { createSeminaryAcademicYear } from '@/controllers/v1/seminary/create-seminary-academic-year';
import { createSeminaryApplication } from '@/controllers/v1/seminary/create-seminary-application';
import { createSeminaryCourse } from '@/controllers/v1/seminary/create-seminary-course';
import { createSeminaryInstructor } from '@/controllers/v1/seminary/create-seminary-instructor';
import { createSeminaryStudent } from '@/controllers/v1/seminary/create-seminary-student';
import { deleteSeminaryAcademicYear } from '@/controllers/v1/seminary/delete-seminary-academic-year';
import { deleteSeminaryCourse } from '@/controllers/v1/seminary/delete-seminary-course';
import { deleteSeminaryInstructor } from '@/controllers/v1/seminary/delete-seminary-instructor';
import { deleteSeminaryStudent } from '@/controllers/v1/seminary/delete-seminary-student';
import { generateSeminaryCredentialDocument } from '@/controllers/v1/seminary/generate-seminary-credential-document';
import { getAllSeminaryAcademicYears } from '@/controllers/v1/seminary/get-all-seminary-academic-years';
import { getAllSeminaryCourses } from '@/controllers/v1/seminary/get-all-seminary-courses';
import { getAllSeminaryFeeCollections } from '@/controllers/v1/seminary/get-all-seminary-fee-collections';
import { getAllSeminaryInstructors } from '@/controllers/v1/seminary/get-all-seminary-instructors';
import { getAllSeminaryStudents } from '@/controllers/v1/seminary/get-all-seminary-students';
import { getSeminaryFeeConfiguration } from '@/controllers/v1/seminary/get-seminary-fee-configuration';
import { getSeminaryGradeConfiguration } from '@/controllers/v1/seminary/get-seminary-grade-configuration';
import { getSeminaryCredentialDocumentByNumber } from '@/controllers/v1/seminary/get-seminary-credential-document-by-number';
import { getSeminaryCredentialDocuments } from '@/controllers/v1/seminary/get-seminary-credential-documents';
import { getSeminaryInstructorById } from '@/controllers/v1/seminary/get-seminary-instructor-by-id';
import { getSeminaryStudentById } from '@/controllers/v1/seminary/get-seminary-student-by-id';
import { updateSeminaryAcademicYear } from '@/controllers/v1/seminary/update-seminary-academic-year';
import { updateSeminaryAcademicYearSession } from '@/controllers/v1/seminary/update-seminary-academic-year-session';
import { updateSeminaryAcademicYearStatus } from '@/controllers/v1/seminary/update-seminary-academic-year-status';
import { updateSeminaryCourse } from '@/controllers/v1/seminary/update-seminary-course';
import { updateSeminaryCourseStatus } from '@/controllers/v1/seminary/update-seminary-course-status';
import { updateSeminaryFeeConfiguration } from '@/controllers/v1/seminary/update-seminary-fee-configuration';
import { updateSeminaryFeeCollectionStatus } from '@/controllers/v1/seminary/update-seminary-fee-collection-status';
import { updateSeminaryFeeCollectionPayment } from '@/controllers/v1/seminary/update-seminary-fee-collection-payment';
import { updateSeminaryGradeConfiguration } from '@/controllers/v1/seminary/update-seminary-grade-configuration';
import { updateSeminaryInstructor } from '@/controllers/v1/seminary/update-seminary-instructor';
import { updateSeminaryInstructorStatus } from '@/controllers/v1/seminary/update-seminary-instructor-status';
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
  createSeminaryCourseSchema,
  createSeminaryInstructorSchema,
  bulkDeleteSeminaryStudentsSchema,
  createSeminaryStudentSchema,
  deleteSeminaryAcademicYearSchema,
  deleteSeminaryCourseSchema,
  deleteSeminaryInstructorSchema,
  deleteSeminaryStudentSchema,
  generateSeminaryCredentialDocumentSchema,
  getAllSeminaryAcademicYearsSchema,
  getAllSeminaryApplicationsSchema,
  getAllSeminaryCoursesSchema,
  getAllSeminaryFeeCollectionsSchema,
  getAllSeminaryInstructorsSchema,
  getAllSeminaryStudentsSchema,
  getSeminaryCredentialDocumentByNumberSchema,
  getSeminaryCredentialDocumentsSchema,
  getSeminaryInstructorByIdSchema,
  getSeminaryApplicationByIdSchema,
  getSeminaryStudentByIdSchema,
  updateSeminaryApplicationStatusSchema,
  updateSeminaryAcademicYearSchema,
  updateSeminaryAcademicYearSessionSchema,
  updateSeminaryAcademicYearStatusSchema,
  updateSeminaryCourseSchema,
  updateSeminaryCourseStatusSchema,
  updateSeminaryFeeConfigurationSchema,
  updateSeminaryFeeCollectionStatusSchema,
  updateSeminaryFeeCollectionPaymentSchema,
  updateSeminaryGradeConfigurationSchema,
  updateSeminaryInstructorSchema,
  updateSeminaryInstructorStatusSchema,
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

router.get(
  '/current/application',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER]),
  getCurrentSeminaryApplication,
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
  '/instructors',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(createSeminaryInstructorSchema),
  createSeminaryInstructor,
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

router.post(
  '/students',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
  validate(createSeminaryStudentSchema),
  createSeminaryStudent,
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
  ...seminaryStudentAdminAccess,
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
