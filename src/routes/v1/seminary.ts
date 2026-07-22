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
import { createSeminaryStudent } from '@/controllers/v1/seminary/create-seminary-student';
import { deleteSeminaryAcademicYear } from '@/controllers/v1/seminary/delete-seminary-academic-year';
import { deleteSeminaryCourse } from '@/controllers/v1/seminary/delete-seminary-course';
import { deleteSeminaryStudent } from '@/controllers/v1/seminary/delete-seminary-student';
import { generateSeminaryCredentialDocument } from '@/controllers/v1/seminary/generate-seminary-credential-document';
import { getAllSeminaryAcademicYears } from '@/controllers/v1/seminary/get-all-seminary-academic-years';
import { getAllSeminaryCourses } from '@/controllers/v1/seminary/get-all-seminary-courses';
import { getAllSeminaryStudents } from '@/controllers/v1/seminary/get-all-seminary-students';
import { getSeminaryGradeConfiguration } from '@/controllers/v1/seminary/get-seminary-grade-configuration';
import { getSeminaryCredentialDocumentByNumber } from '@/controllers/v1/seminary/get-seminary-credential-document-by-number';
import { getSeminaryCredentialDocuments } from '@/controllers/v1/seminary/get-seminary-credential-documents';
import { getSeminaryStudentById } from '@/controllers/v1/seminary/get-seminary-student-by-id';
import { updateSeminaryAcademicYear } from '@/controllers/v1/seminary/update-seminary-academic-year';
import { updateSeminaryAcademicYearSession } from '@/controllers/v1/seminary/update-seminary-academic-year-session';
import { updateSeminaryAcademicYearStatus } from '@/controllers/v1/seminary/update-seminary-academic-year-status';
import { updateSeminaryCourse } from '@/controllers/v1/seminary/update-seminary-course';
import { updateSeminaryCourseStatus } from '@/controllers/v1/seminary/update-seminary-course-status';
import { updateSeminaryGradeConfiguration } from '@/controllers/v1/seminary/update-seminary-grade-configuration';
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
  bulkDeleteSeminaryStudentsSchema,
  createSeminaryStudentSchema,
  deleteSeminaryAcademicYearSchema,
  deleteSeminaryCourseSchema,
  deleteSeminaryStudentSchema,
  generateSeminaryCredentialDocumentSchema,
  getAllSeminaryAcademicYearsSchema,
  getAllSeminaryApplicationsSchema,
  getAllSeminaryCoursesSchema,
  getAllSeminaryStudentsSchema,
  getSeminaryCredentialDocumentByNumberSchema,
  getSeminaryCredentialDocumentsSchema,
  getSeminaryApplicationByIdSchema,
  getSeminaryStudentByIdSchema,
  updateSeminaryApplicationStatusSchema,
  updateSeminaryAcademicYearSchema,
  updateSeminaryAcademicYearSessionSchema,
  updateSeminaryAcademicYearStatusSchema,
  updateSeminaryCourseSchema,
  updateSeminaryCourseStatusSchema,
  updateSeminaryGradeConfigurationSchema,
  updateSeminaryStudentSchema,
  upsertCurrentSeminaryApplicationSchema,
  verifySeminaryCredentialDocumentSchema,
} from '@/validators/seminary';

const router = Router();
const seminaryStudentAdminAccess = config.BYPASS_SEMINARY_STUDENT_AUTH
  ? []
  : [authenticate, authorize([UserType.ADMIN])];

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
  '/students',
  expressRateLimit('basic'),
  ...seminaryStudentAdminAccess,
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
  ...seminaryStudentAdminAccess,
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
  ...seminaryStudentAdminAccess,
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
