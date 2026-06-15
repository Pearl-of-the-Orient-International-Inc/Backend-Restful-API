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
const sanitation_1 = require("../../common/sanitation");
const uploadthing_1 = require("../../lib/uploadthing");
const authentication_1 = require("../../middlewares/authentication");
const authorization_1 = __importDefault(require("../../middlewares/authorization"));
const express_rate_limiter_1 = require("../../middlewares/express-rate-limiter");
const enums_1 = require("../../generated/prisma/enums");
const seminary_1 = require("../../validators/seminary");
const router = (0, express_1.Router)();
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
exports.default = router;
