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
import { createSeminaryStudent } from '@/controllers/v1/seminary/create-seminary-student';
import { generateSeminaryCredentialDocument } from '@/controllers/v1/seminary/generate-seminary-credential-document';
import { getAllSeminaryStudents } from '@/controllers/v1/seminary/get-all-seminary-students';
import { getSeminaryCredentialDocumentByNumber } from '@/controllers/v1/seminary/get-seminary-credential-document-by-number';
import { getSeminaryCredentialDocuments } from '@/controllers/v1/seminary/get-seminary-credential-documents';
import { getSeminaryStudentById } from '@/controllers/v1/seminary/get-seminary-student-by-id';
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
  createSeminaryStudentSchema,
  generateSeminaryCredentialDocumentSchema,
  getAllSeminaryApplicationsSchema,
  getAllSeminaryStudentsSchema,
  getSeminaryCredentialDocumentByNumberSchema,
  getSeminaryCredentialDocumentsSchema,
  getSeminaryApplicationByIdSchema,
  getSeminaryStudentByIdSchema,
  updateSeminaryApplicationStatusSchema,
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

export default router;
