"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const get_current_seminary_application_1 = require("../../controllers/v1/seminary/get-current-seminary-application");
const upsert_current_seminary_application_1 = require("../../controllers/v1/seminary/upsert-current-seminary-application");
const get_all_seminary_applications_1 = require("../../controllers/v1/seminary/get-all-seminary-applications");
const get_seminary_application_by_id_1 = require("../../controllers/v1/seminary/get-seminary-application-by-id");
const update_seminary_application_status_1 = require("../../controllers/v1/seminary/update-seminary-application-status");
const bulk_import_seminary_students_1 = require("../../controllers/v1/seminary/bulk-import-seminary-students");
const bulk_delete_seminary_students_1 = require("../../controllers/v1/seminary/bulk-delete-seminary-students");
const create_seminary_student_1 = require("../../controllers/v1/seminary/create-seminary-student");
const delete_seminary_student_1 = require("../../controllers/v1/seminary/delete-seminary-student");
const generate_seminary_credential_document_1 = require("../../controllers/v1/seminary/generate-seminary-credential-document");
const get_all_seminary_students_1 = require("../../controllers/v1/seminary/get-all-seminary-students");
const get_seminary_credential_document_by_number_1 = require("../../controllers/v1/seminary/get-seminary-credential-document-by-number");
const get_seminary_credential_documents_1 = require("../../controllers/v1/seminary/get-seminary-credential-documents");
const get_seminary_student_by_id_1 = require("../../controllers/v1/seminary/get-seminary-student-by-id");
const update_seminary_student_1 = require("../../controllers/v1/seminary/update-seminary-student");
const verify_seminary_credential_document_1 = require("../../controllers/v1/seminary/verify-seminary-credential-document");
const sanitation_1 = require("../../common/sanitation");
const config_1 = __importDefault(require("../../config"));
const uploadthing_1 = require("../../lib/uploadthing");
const authentication_1 = require("../../middlewares/authentication");
const authorization_1 = __importDefault(require("../../middlewares/authorization"));
const express_rate_limiter_1 = require("../../middlewares/express-rate-limiter");
const enums_1 = require("../../generated/prisma/enums");
const seminary_1 = require("../../validators/seminary");
const router = (0, express_1.Router)();
const seminaryStudentAdminAccess = config_1.default.BYPASS_SEMINARY_STUDENT_AUTH
    ? []
    : [authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN])];
router.get('/current/application', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), get_current_seminary_application_1.getCurrentSeminaryApplication);
router.put('/current/application', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, sanitation_1.validate)(seminary_1.upsertCurrentSeminaryApplicationSchema), upsert_current_seminary_application_1.upsertCurrentSeminaryApplication);
router.use('/requirements/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '16MB',
    maxFileCount: 1,
}));
router.use('/payment-receipts/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '8MB',
    maxFileCount: 1,
}));
router.get('/applications', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.getAllSeminaryApplicationsSchema), get_all_seminary_applications_1.getAllSeminaryApplications);
router.get('/applications/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.getSeminaryApplicationByIdSchema), get_seminary_application_by_id_1.getSeminaryApplicationById);
router.patch('/applications/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.updateSeminaryApplicationStatusSchema), update_seminary_application_status_1.updateSeminaryApplicationStatus);
router.get('/students', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryStudentsSchema), get_all_seminary_students_1.getAllSeminaryStudents);
router.post('/students', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.createSeminaryStudentSchema), create_seminary_student_1.createSeminaryStudent);
router.post('/students/bulk-import', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.bulkImportSeminaryStudentsSchema), bulk_import_seminary_students_1.bulkImportSeminaryStudents);
router.delete('/students/bulk-delete', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.bulkDeleteSeminaryStudentsSchema), bulk_delete_seminary_students_1.bulkDeleteSeminaryStudents);
router.get('/credential-documents/verify/:token', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, sanitation_1.validate)(seminary_1.verifySeminaryCredentialDocumentSchema), verify_seminary_credential_document_1.verifySeminaryCredentialDocument);
router.get('/credential-documents/:documentNumber', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.getSeminaryCredentialDocumentByNumberSchema), get_seminary_credential_document_by_number_1.getSeminaryCredentialDocumentByNumber);
router.get('/students/:studentId/credential-documents', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.getSeminaryCredentialDocumentsSchema), get_seminary_credential_documents_1.getSeminaryCredentialDocuments);
router.post('/students/:studentId/credential-documents', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.generateSeminaryCredentialDocumentSchema), generate_seminary_credential_document_1.generateSeminaryCredentialDocument);
router.get('/students/:studentId', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.getSeminaryStudentByIdSchema), get_seminary_student_by_id_1.getSeminaryStudentById);
router.put('/students/:studentId', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryStudentSchema), update_seminary_student_1.updateSeminaryStudent);
router.delete('/students/:studentId', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.deleteSeminaryStudentSchema), delete_seminary_student_1.deleteSeminaryStudent);
exports.default = router;
