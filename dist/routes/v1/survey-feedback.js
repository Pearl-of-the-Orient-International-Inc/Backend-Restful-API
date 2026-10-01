"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sanitation_1 = require("@/common/sanitation");
const survey_feedback_controller_1 = require("@/controllers/v1/survey-feedback/survey-feedback.controller");
const enums_1 = require("@/generated/prisma/enums");
const authentication_1 = require("@/middlewares/authentication");
const authorization_1 = __importDefault(require("@/middlewares/authorization"));
const express_rate_limiter_1 = require("@/middlewares/express-rate-limiter");
const survey_feedback_1 = require("@/validators/survey-feedback");
const router = (0, express_1.Router)();
router.post('/public/responses', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, sanitation_1.validate)(survey_feedback_1.createSurveyFeedbackResponseSchema), survey_feedback_controller_1.createPublicSurveyFeedbackResponse);
router.get('/responses', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), survey_feedback_controller_1.getAdminSurveyFeedbackResponses);
exports.default = router;
