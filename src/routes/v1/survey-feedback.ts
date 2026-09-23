import { Router } from 'express';
import { validate } from '@/common/sanitation';
import { createPublicSurveyFeedbackResponse, getAdminSurveyFeedbackResponses } from '@/controllers/v1/survey-feedback/survey-feedback.controller';
import { UserType } from '@/generated/prisma/enums';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { createSurveyFeedbackResponseSchema } from '@/validators/survey-feedback';

const router = Router();

router.post('/public/responses', expressRateLimit('basic'), validate(createSurveyFeedbackResponseSchema), createPublicSurveyFeedbackResponse);
router.get('/responses', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), getAdminSurveyFeedbackResponses);

export default router;
