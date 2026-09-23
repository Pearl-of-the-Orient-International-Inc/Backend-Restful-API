import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { CreateSurveyFeedbackResponseBody } from '@/validators/survey-feedback';

export const createPublicSurveyFeedbackResponse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateSurveyFeedbackResponseBody;
    const response = await prisma.surveyFeedbackResponse.create({
      data: {
        respondentName: body.respondentName?.trim() || null,
        respondentType: body.respondentType,
        discoverySource: body.discoverySource,
        improvementAreas: body.improvementAreas,
        welcomeRating: body.welcomeRating,
        accessibilityRating: body.accessibilityRating,
        satisfactionRating: body.satisfactionRating,
        feedback: body.feedback.trim(),
        hasIssue: body.hasIssue,
        issueCategory: body.hasIssue ? body.issueCategory : null,
        issueDescription: body.hasIssue ? body.issueDescription?.trim() || null : null,
        contactEmail: body.hasIssue ? body.contactEmail?.trim().toLowerCase() || null : null,
      },
      select: { id: true, createdAt: true },
    });
    res.status(HTTPSTATUS.CREATED).json({ code: 'CREATED', message: 'Thank you. Your survey response was submitted successfully.', data: response });
  } catch (err) {
    logger.error('Error while creating survey feedback response', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to submit the survey response' });
  }
};

export const getAdminSurveyFeedbackResponses = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const responses = await prisma.surveyFeedbackResponse.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message: 'Survey responses retrieved successfully', data: responses });
  } catch (err) {
    logger.error('Error while retrieving survey feedback responses', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to retrieve survey responses' });
  }
};
