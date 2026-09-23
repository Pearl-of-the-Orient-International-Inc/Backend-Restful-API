import { Router } from 'express';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { validate } from '@/common/sanitation';
import { UserType } from '@/generated/prisma/enums';
import { createUploadthingExpressHandler } from '@/lib/uploadthing';
import { getAllOrdinationApplications, getCurrentOrdinationApplication, reviewOrdinationApplication, saveCurrentOrdinationApplication, submitCurrentOrdinationApplication } from '@/controllers/v1/ordination-application/ordination-application.controller';
import { reviewOrdinationApplicationSchema, saveOrdinationApplicationSchema, submitOrdinationApplicationSchema } from '@/validators/ordination-application';

const router = Router();
router.use('/current/documents/upload', expressRateLimit('basic'), createUploadthingExpressHandler({ maxFileSize: '16MB', maxFileCount: 1 }));
router.get('/current', expressRateLimit('basic'), authenticate, authorize([UserType.MEMBER, UserType.OFFICER]), getCurrentOrdinationApplication);
router.put('/current', expressRateLimit('basic'), authenticate, authorize([UserType.MEMBER, UserType.OFFICER]), validate(saveOrdinationApplicationSchema), saveCurrentOrdinationApplication);
router.post('/current/submit', expressRateLimit('basic'), authenticate, authorize([UserType.MEMBER, UserType.OFFICER]), validate(submitOrdinationApplicationSchema), submitCurrentOrdinationApplication);
router.get('/', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), getAllOrdinationApplications);
router.patch('/:id/review', expressRateLimit('basic'), authenticate, authorize([UserType.ADMIN]), validate(reviewOrdinationApplicationSchema), reviewOrdinationApplication);
export default router;
