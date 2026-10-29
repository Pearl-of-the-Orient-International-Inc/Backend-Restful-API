"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const get_current_seminary_application_1 = require("@/controllers/v1/seminary/get-current-seminary-application");
const get_current_seminary_student_notifications_1 = require("@/controllers/v1/seminary/get-current-seminary-student-notifications");
const get_current_student_portal_1 = require("@/controllers/v1/seminary/get-current-student-portal");
const upsert_current_seminary_application_1 = require("@/controllers/v1/seminary/upsert-current-seminary-application");
const get_all_seminary_applications_1 = require("@/controllers/v1/seminary/get-all-seminary-applications");
const get_seminary_application_by_id_1 = require("@/controllers/v1/seminary/get-seminary-application-by-id");
const update_seminary_application_status_1 = require("@/controllers/v1/seminary/update-seminary-application-status");
const bulk_import_seminary_students_1 = require("@/controllers/v1/seminary/bulk-import-seminary-students");
const bulk_delete_seminary_students_1 = require("@/controllers/v1/seminary/bulk-delete-seminary-students");
const create_seminary_academic_year_1 = require("@/controllers/v1/seminary/create-seminary-academic-year");
const create_seminary_application_1 = require("@/controllers/v1/seminary/create-seminary-application");
const create_seminary_assignment_1 = require("@/controllers/v1/seminary/create-seminary-assignment");
const create_seminary_course_1 = require("@/controllers/v1/seminary/create-seminary-course");
const create_seminary_examination_1 = require("@/controllers/v1/seminary/create-seminary-examination");
const create_seminary_grade_record_1 = require("@/controllers/v1/seminary/create-seminary-grade-record");
const bulk_encode_seminary_grades_1 = require("@/controllers/v1/seminary/bulk-encode-seminary-grades");
const create_seminary_instructor_1 = require("@/controllers/v1/seminary/create-seminary-instructor");
const create_seminary_study_material_1 = require("@/controllers/v1/seminary/create-seminary-study-material");
const create_seminary_student_1 = require("@/controllers/v1/seminary/create-seminary-student");
const change_seminary_student_password_1 = require("@/controllers/v1/seminary/change-seminary-student-password");
const delete_seminary_academic_year_1 = require("@/controllers/v1/seminary/delete-seminary-academic-year");
const delete_seminary_assignment_1 = require("@/controllers/v1/seminary/delete-seminary-assignment");
const delete_seminary_course_1 = require("@/controllers/v1/seminary/delete-seminary-course");
const delete_seminary_examination_1 = require("@/controllers/v1/seminary/delete-seminary-examination");
const delete_seminary_grade_record_1 = require("@/controllers/v1/seminary/delete-seminary-grade-record");
const delete_seminary_instructor_1 = require("@/controllers/v1/seminary/delete-seminary-instructor");
const delete_seminary_study_material_1 = require("@/controllers/v1/seminary/delete-seminary-study-material");
const delete_seminary_student_1 = require("@/controllers/v1/seminary/delete-seminary-student");
const generate_seminary_credential_document_1 = require("@/controllers/v1/seminary/generate-seminary-credential-document");
const get_all_seminary_academic_years_1 = require("@/controllers/v1/seminary/get-all-seminary-academic-years");
const get_all_seminary_assignments_1 = require("@/controllers/v1/seminary/get-all-seminary-assignments");
const get_all_seminary_courses_1 = require("@/controllers/v1/seminary/get-all-seminary-courses");
const get_all_seminary_examinations_1 = require("@/controllers/v1/seminary/get-all-seminary-examinations");
const get_all_seminary_grade_records_1 = require("@/controllers/v1/seminary/get-all-seminary-grade-records");
const get_all_seminary_fee_collections_1 = require("@/controllers/v1/seminary/get-all-seminary-fee-collections");
const get_all_seminary_instructors_1 = require("@/controllers/v1/seminary/get-all-seminary-instructors");
const get_all_seminary_study_materials_1 = require("@/controllers/v1/seminary/get-all-seminary-study-materials");
const get_all_seminary_students_1 = require("@/controllers/v1/seminary/get-all-seminary-students");
const get_seminary_fee_configuration_1 = require("@/controllers/v1/seminary/get-seminary-fee-configuration");
const get_seminary_grade_configuration_1 = require("@/controllers/v1/seminary/get-seminary-grade-configuration");
const get_seminary_grade_record_1 = require("@/controllers/v1/seminary/get-seminary-grade-record");
const get_seminary_credential_document_by_number_1 = require("@/controllers/v1/seminary/get-seminary-credential-document-by-number");
const get_seminary_credential_documents_1 = require("@/controllers/v1/seminary/get-seminary-credential-documents");
const get_seminary_examination_by_id_1 = require("@/controllers/v1/seminary/get-seminary-examination-by-id");
const get_seminary_instructor_by_id_1 = require("@/controllers/v1/seminary/get-seminary-instructor-by-id");
const instructor_invitation_1 = require("@/controllers/v1/seminary/instructor-invitation");
const get_seminary_student_by_id_1 = require("@/controllers/v1/seminary/get-seminary-student-by-id");
const get_public_seminary_student_1 = require("@/controllers/v1/seminary/get-public-seminary-student");
const update_seminary_academic_year_1 = require("@/controllers/v1/seminary/update-seminary-academic-year");
const update_seminary_academic_year_session_1 = require("@/controllers/v1/seminary/update-seminary-academic-year-session");
const update_seminary_academic_year_status_1 = require("@/controllers/v1/seminary/update-seminary-academic-year-status");
const update_seminary_assignment_1 = require("@/controllers/v1/seminary/update-seminary-assignment");
const update_seminary_assignment_status_1 = require("@/controllers/v1/seminary/update-seminary-assignment-status");
const update_seminary_course_1 = require("@/controllers/v1/seminary/update-seminary-course");
const update_seminary_course_status_1 = require("@/controllers/v1/seminary/update-seminary-course-status");
const update_seminary_examination_1 = require("@/controllers/v1/seminary/update-seminary-examination");
const update_seminary_examination_status_1 = require("@/controllers/v1/seminary/update-seminary-examination-status");
const update_seminary_grade_record_1 = require("@/controllers/v1/seminary/update-seminary-grade-record");
const update_seminary_grade_record_status_1 = require("@/controllers/v1/seminary/update-seminary-grade-record-status");
const update_seminary_fee_configuration_1 = require("@/controllers/v1/seminary/update-seminary-fee-configuration");
const update_seminary_fee_collection_status_1 = require("@/controllers/v1/seminary/update-seminary-fee-collection-status");
const update_seminary_fee_collection_payment_1 = require("@/controllers/v1/seminary/update-seminary-fee-collection-payment");
const update_seminary_grade_configuration_1 = require("@/controllers/v1/seminary/update-seminary-grade-configuration");
const update_seminary_instructor_1 = require("@/controllers/v1/seminary/update-seminary-instructor");
const update_seminary_instructor_status_1 = require("@/controllers/v1/seminary/update-seminary-instructor-status");
const update_seminary_study_material_1 = require("@/controllers/v1/seminary/update-seminary-study-material");
const update_seminary_student_1 = require("@/controllers/v1/seminary/update-seminary-student");
const verify_seminary_credential_document_1 = require("@/controllers/v1/seminary/verify-seminary-credential-document");
const course_schedules_1 = require("@/controllers/v1/seminary/course-schedules");
const document_requests_1 = require("@/controllers/v1/seminary/document-requests");
const announcements_1 = require("@/controllers/v1/seminary/announcements");
const dashboard_1 = require("@/controllers/v1/seminary/dashboard");
const reports_1 = require("@/controllers/v1/seminary/reports");
const sanitation_1 = require("@/common/sanitation");
const config_1 = __importDefault(require("@/config"));
const uploadthing_1 = require("@/lib/uploadthing");
const authentication_1 = require("@/middlewares/authentication");
const authorization_1 = __importDefault(require("@/middlewares/authorization"));
const seminary_schedule_manager_1 = require("@/middlewares/seminary-schedule-manager");
const express_rate_limiter_1 = require("@/middlewares/express-rate-limiter");
const enums_1 = require("@/generated/prisma/enums");
const seminary_1 = require("@/validators/seminary");
const router = (0, express_1.Router)();
const seminaryStudentAdminAccess = config_1.default.BYPASS_SEMINARY_STUDENT_AUTH
    ? []
    : [authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN])];
const seminaryStudentReadAccess = config_1.default.BYPASS_SEMINARY_STUDENT_AUTH
    ? []
    : [authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN, enums_1.UserType.INSTRUCTOR])];
const seminaryStudyMaterialAccess = [
    authentication_1.authenticate,
    (0, authorization_1.default)([enums_1.UserType.ADMIN, enums_1.UserType.INSTRUCTOR]),
];
const seminaryAssignmentAccess = [
    authentication_1.authenticate,
    (0, authorization_1.default)([enums_1.UserType.ADMIN, enums_1.UserType.INSTRUCTOR]),
];
const seminaryExaminationAccess = [
    authentication_1.authenticate,
    (0, authorization_1.default)([enums_1.UserType.ADMIN, enums_1.UserType.INSTRUCTOR]),
];
const seminaryLmsReadAccess = [
    authentication_1.authenticate,
    (0, authorization_1.default)([enums_1.UserType.ADMIN, enums_1.UserType.INSTRUCTOR, enums_1.UserType.MEMBER]),
];
const seminaryGradeRecordAccess = [
    authentication_1.authenticate,
    (0, authorization_1.default)([enums_1.UserType.ADMIN, enums_1.UserType.INSTRUCTOR]),
];
router.get('/current/application', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), get_current_seminary_application_1.getCurrentSeminaryApplication);
router.get('/current/student-notifications', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, get_current_seminary_student_notifications_1.getCurrentSeminaryStudentNotifications);
router.get('/current/student-portal', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), get_current_student_portal_1.getCurrentStudentPortal);
router.put('/current/application', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, sanitation_1.validate)(seminary_1.upsertCurrentSeminaryApplicationSchema), upsert_current_seminary_application_1.upsertCurrentSeminaryApplication);
router.use('/requirements/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '16MB',
    maxFileCount: 1,
}));
router.use('/payment-receipts/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '8MB',
    maxFileCount: 1,
}));
router.use('/study-materials/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '32MB',
    maxFileCount: 1,
}));
router.get('/applications', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.getAllSeminaryApplicationsSchema), get_all_seminary_applications_1.getAllSeminaryApplications);
router.get('/dashboard', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.getSeminaryDashboardSchema), dashboard_1.getSeminaryDashboard);
router.get('/reports', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.getSeminaryReportsSchema), reports_1.getSeminaryReports);
router.post('/applications', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.createSeminaryApplicationSchema), create_seminary_application_1.createSeminaryApplication);
router.get('/applications/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.getSeminaryApplicationByIdSchema), get_seminary_application_by_id_1.getSeminaryApplicationById);
router.patch('/applications/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.updateSeminaryApplicationStatusSchema), update_seminary_application_status_1.updateSeminaryApplicationStatus);
router.get('/enrollments', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryApplicationsSchema), get_all_seminary_applications_1.getAllSeminaryApplications);
router.patch('/enrollments/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryApplicationStatusSchema), update_seminary_application_status_1.updateSeminaryApplicationStatus);
router.get('/instructors', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryInstructorsSchema), get_all_seminary_instructors_1.getAllSeminaryInstructors);
router.post('/instructors/accept-invite', (0, express_rate_limiter_1.expressRateLimit)('passwordReset'), (0, sanitation_1.validate)(seminary_1.acceptSeminaryInstructorInviteSchema), instructor_invitation_1.acceptSeminaryInstructorInvite);
router.post('/instructors', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.createSeminaryInstructorSchema), create_seminary_instructor_1.createSeminaryInstructor);
router.post('/instructors/:id/invite', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.inviteSeminaryInstructorSchema), instructor_invitation_1.inviteSeminaryInstructor);
router.get('/instructors/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.getSeminaryInstructorByIdSchema), get_seminary_instructor_by_id_1.getSeminaryInstructorById);
router.put('/instructors/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryInstructorSchema), update_seminary_instructor_1.updateSeminaryInstructor);
router.patch('/instructors/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryInstructorStatusSchema), update_seminary_instructor_status_1.updateSeminaryInstructorStatus);
router.delete('/instructors/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.deleteSeminaryInstructorSchema), delete_seminary_instructor_1.deleteSeminaryInstructor);
router.get('/students', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentReadAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryStudentsSchema), get_all_seminary_students_1.getAllSeminaryStudents);
router.get('/public/students/:studentId', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, sanitation_1.validate)(seminary_1.getPublicSeminaryStudentSchema), get_public_seminary_student_1.getPublicSeminaryStudent);
router.post('/students', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.createSeminaryStudentSchema), create_seminary_student_1.createSeminaryStudent);
router.patch('/students/:studentId/password', (0, express_rate_limiter_1.expressRateLimit)('passwordReset'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.changeSeminaryStudentPasswordSchema), change_seminary_student_password_1.changeSeminaryStudentPassword);
router.post('/students/bulk-import', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.bulkImportSeminaryStudentsSchema), bulk_import_seminary_students_1.bulkImportSeminaryStudents);
router.delete('/students/bulk-delete', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.bulkDeleteSeminaryStudentsSchema), bulk_delete_seminary_students_1.bulkDeleteSeminaryStudents);
router.get('/courses', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentReadAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryCoursesSchema), get_all_seminary_courses_1.getAllSeminaryCourses);
router.post('/courses', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.createSeminaryCourseSchema), create_seminary_course_1.createSeminaryCourse);
router.put('/courses/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryCourseSchema), update_seminary_course_1.updateSeminaryCourse);
router.patch('/courses/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryCourseStatusSchema), update_seminary_course_status_1.updateSeminaryCourseStatus);
router.delete('/courses/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.deleteSeminaryCourseSchema), delete_seminary_course_1.deleteSeminaryCourse);
router.get('/announcements', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN, enums_1.UserType.INSTRUCTOR, enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(seminary_1.getSeminaryAnnouncementsSchema), announcements_1.getSeminaryAnnouncements);
router.post('/announcements', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.createSeminaryAnnouncementSchema), announcements_1.createSeminaryAnnouncement);
router.put('/announcements/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.updateSeminaryAnnouncementSchema), announcements_1.updateSeminaryAnnouncement);
router.delete('/announcements/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(seminary_1.deleteSeminaryAnnouncementSchema), announcements_1.deleteSeminaryAnnouncement);
router.get('/course-schedules', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN, enums_1.UserType.INSTRUCTOR, enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(seminary_1.getAllSeminaryCourseSchedulesSchema), course_schedules_1.getSeminaryCourseSchedules);
router.post('/course-schedules', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, seminary_schedule_manager_1.authorizeSeminaryScheduleManager, (0, sanitation_1.validate)(seminary_1.createSeminaryCourseScheduleSchema), course_schedules_1.createSeminaryCourseSchedule);
router.put('/course-schedules/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, seminary_schedule_manager_1.authorizeSeminaryScheduleManager, (0, sanitation_1.validate)(seminary_1.updateSeminaryCourseScheduleSchema), course_schedules_1.updateSeminaryCourseSchedule);
router.delete('/course-schedules/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, seminary_schedule_manager_1.authorizeSeminaryScheduleManager, (0, sanitation_1.validate)(seminary_1.deleteSeminaryCourseScheduleSchema), course_schedules_1.deleteSeminaryCourseSchedule);
router.get('/document-request-types', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN, enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(seminary_1.getSeminaryDocumentRequestTypesSchema), document_requests_1.getSeminaryDocumentRequestTypes);
router.post('/document-request-types', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.createSeminaryDocumentRequestTypeSchema), document_requests_1.createSeminaryDocumentRequestType);
router.put('/document-request-types/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryDocumentRequestTypeSchema), document_requests_1.updateSeminaryDocumentRequestType);
router.get('/document-requests', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN, enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(seminary_1.getSeminaryDocumentRequestsSchema), document_requests_1.getSeminaryDocumentRequests);
router.post('/document-requests', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER]), (0, sanitation_1.validate)(seminary_1.createSeminaryDocumentRequestSchema), document_requests_1.createSeminaryDocumentRequest);
router.patch('/document-requests/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryDocumentRequestStatusSchema), document_requests_1.updateSeminaryDocumentRequestStatus);
router.get('/study-materials', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryLmsReadAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryStudyMaterialsSchema), get_all_seminary_study_materials_1.getAllSeminaryStudyMaterials);
router.post('/study-materials', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudyMaterialAccess, (0, sanitation_1.validate)(seminary_1.createSeminaryStudyMaterialSchema), create_seminary_study_material_1.createSeminaryStudyMaterial);
router.put('/study-materials/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudyMaterialAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryStudyMaterialSchema), update_seminary_study_material_1.updateSeminaryStudyMaterial);
router.delete('/study-materials/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudyMaterialAccess, (0, sanitation_1.validate)(seminary_1.deleteSeminaryStudyMaterialSchema), delete_seminary_study_material_1.deleteSeminaryStudyMaterial);
router.get('/assignments', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryLmsReadAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryAssignmentsSchema), get_all_seminary_assignments_1.getAllSeminaryAssignments);
router.post('/assignments', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryAssignmentAccess, (0, sanitation_1.validate)(seminary_1.createSeminaryAssignmentSchema), create_seminary_assignment_1.createSeminaryAssignment);
router.put('/assignments/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryAssignmentAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryAssignmentSchema), update_seminary_assignment_1.updateSeminaryAssignment);
router.patch('/assignments/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryAssignmentAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryAssignmentStatusSchema), update_seminary_assignment_status_1.updateSeminaryAssignmentStatus);
router.delete('/assignments/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryAssignmentAccess, (0, sanitation_1.validate)(seminary_1.deleteSeminaryAssignmentSchema), delete_seminary_assignment_1.deleteSeminaryAssignment);
router.get('/examinations', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryLmsReadAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryExaminationsSchema), get_all_seminary_examinations_1.getAllSeminaryExaminations);
router.post('/examinations', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryExaminationAccess, (0, sanitation_1.validate)(seminary_1.createSeminaryExaminationSchema), create_seminary_examination_1.createSeminaryExamination);
router.get('/examinations/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryLmsReadAccess, (0, sanitation_1.validate)(seminary_1.getSeminaryExaminationByIdSchema), get_seminary_examination_by_id_1.getSeminaryExaminationById);
router.put('/examinations/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryExaminationAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryExaminationSchema), update_seminary_examination_1.updateSeminaryExamination);
router.patch('/examinations/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryExaminationAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryExaminationStatusSchema), update_seminary_examination_status_1.updateSeminaryExaminationStatus);
router.delete('/examinations/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryExaminationAccess, (0, sanitation_1.validate)(seminary_1.deleteSeminaryExaminationSchema), delete_seminary_examination_1.deleteSeminaryExamination);
router.get('/academic-years', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryAcademicYearsSchema), get_all_seminary_academic_years_1.getAllSeminaryAcademicYears);
router.post('/academic-years', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.createSeminaryAcademicYearSchema), create_seminary_academic_year_1.createSeminaryAcademicYear);
router.put('/academic-years/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryAcademicYearSchema), update_seminary_academic_year_1.updateSeminaryAcademicYear);
router.patch('/academic-years/:id/session', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryAcademicYearSessionSchema), update_seminary_academic_year_session_1.updateSeminaryAcademicYearSession);
router.patch('/academic-years/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryAcademicYearStatusSchema), update_seminary_academic_year_status_1.updateSeminaryAcademicYearStatus);
router.delete('/academic-years/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.deleteSeminaryAcademicYearSchema), delete_seminary_academic_year_1.deleteSeminaryAcademicYear);
router.get('/grade-configuration', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, get_seminary_grade_configuration_1.getSeminaryGradeConfiguration);
router.put('/grade-configuration', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryGradeConfigurationSchema), update_seminary_grade_configuration_1.updateSeminaryGradeConfiguration);
router.get('/grade-records', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryGradeRecordAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryGradeRecordsSchema), get_all_seminary_grade_records_1.getAllSeminaryGradeRecords);
router.post('/grade-records/encode', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryGradeRecordAccess, (0, sanitation_1.validate)(seminary_1.bulkEncodeSeminaryGradesSchema), bulk_encode_seminary_grades_1.bulkEncodeSeminaryGrades);
router.post('/grade-records', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryGradeRecordAccess, (0, sanitation_1.validate)(seminary_1.createSeminaryGradeRecordSchema), create_seminary_grade_record_1.createSeminaryGradeRecord);
router.get('/grade-records/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryGradeRecordAccess, (0, sanitation_1.validate)(seminary_1.getSeminaryGradeRecordSchema), get_seminary_grade_record_1.getSeminaryGradeRecord);
router.put('/grade-records/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryGradeRecordAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryGradeRecordSchema), update_seminary_grade_record_1.updateSeminaryGradeRecord);
router.patch('/grade-records/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryGradeRecordAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryGradeRecordStatusSchema), update_seminary_grade_record_status_1.updateSeminaryGradeRecordStatus);
router.delete('/grade-records/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryGradeRecordAccess, (0, sanitation_1.validate)(seminary_1.deleteSeminaryGradeRecordSchema), delete_seminary_grade_record_1.deleteSeminaryGradeRecord);
router.get('/fee-configuration', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, get_seminary_fee_configuration_1.getSeminaryFeeConfiguration);
router.put('/fee-configuration', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryFeeConfigurationSchema), update_seminary_fee_configuration_1.updateSeminaryFeeConfiguration);
router.get('/fee-collections', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.getAllSeminaryFeeCollectionsSchema), get_all_seminary_fee_collections_1.getAllSeminaryFeeCollections);
router.patch('/fee-collections/:id/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryFeeCollectionStatusSchema), update_seminary_fee_collection_status_1.updateSeminaryFeeCollectionStatus);
router.patch('/fee-collections/:id/payment', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryFeeCollectionPaymentSchema), update_seminary_fee_collection_payment_1.updateSeminaryFeeCollectionPayment);
router.get('/credential-documents/verify/:token', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, sanitation_1.validate)(seminary_1.verifySeminaryCredentialDocumentSchema), verify_seminary_credential_document_1.verifySeminaryCredentialDocument);
router.get('/credential-documents/:documentNumber', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.getSeminaryCredentialDocumentByNumberSchema), get_seminary_credential_document_by_number_1.getSeminaryCredentialDocumentByNumber);
router.get('/students/:studentId/credential-documents', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentReadAccess, (0, sanitation_1.validate)(seminary_1.getSeminaryCredentialDocumentsSchema), get_seminary_credential_documents_1.getSeminaryCredentialDocuments);
router.post('/students/:studentId/credential-documents', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.generateSeminaryCredentialDocumentSchema), generate_seminary_credential_document_1.generateSeminaryCredentialDocument);
router.get('/students/:studentId', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentReadAccess, (0, sanitation_1.validate)(seminary_1.getSeminaryStudentByIdSchema), get_seminary_student_by_id_1.getSeminaryStudentById);
router.put('/students/:studentId', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.updateSeminaryStudentSchema), update_seminary_student_1.updateSeminaryStudent);
router.delete('/students/:studentId', (0, express_rate_limiter_1.expressRateLimit)('basic'), ...seminaryStudentAdminAccess, (0, sanitation_1.validate)(seminary_1.deleteSeminaryStudentSchema), delete_seminary_student_1.deleteSeminaryStudent);
exports.default = router;
