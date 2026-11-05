"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminSurveyFeedbackResponses = exports.createPublicSurveyFeedbackResponse = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const createPublicSurveyFeedbackResponse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const body = req.body;
        const response = yield prisma_1.prisma.surveyFeedbackResponse.create({
            data: {
                respondentName: ((_a = body.respondentName) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                respondentType: body.respondentType,
                discoverySource: body.discoverySource,
                improvementAreas: body.improvementAreas,
                welcomeRating: body.welcomeRating,
                accessibilityRating: body.accessibilityRating,
                satisfactionRating: body.satisfactionRating,
                feedback: body.feedback.trim(),
                hasIssue: body.hasIssue,
                issueCategory: body.hasIssue ? body.issueCategory : null,
                issueDescription: body.hasIssue ? ((_b = body.issueDescription) === null || _b === void 0 ? void 0 : _b.trim()) || null : null,
                contactEmail: body.hasIssue ? ((_c = body.contactEmail) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase()) || null : null,
            },
            select: { id: true, createdAt: true },
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Thank you. Your survey response was submitted successfully.', data: response });
    }
    catch (err) {
        winston_1.logger.error('Error while creating survey feedback response', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to submit the survey response' });
    }
});
exports.createPublicSurveyFeedbackResponse = createPublicSurveyFeedbackResponse;
const getAdminSurveyFeedbackResponses = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const responses = yield prisma_1.prisma.surveyFeedbackResponse.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', message: 'Survey responses retrieved successfully', data: responses });
    }
    catch (err) {
        winston_1.logger.error('Error while retrieving survey feedback responses', { err });
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to retrieve survey responses' });
    }
});
exports.getAdminSurveyFeedbackResponses = getAdminSurveyFeedbackResponses;
