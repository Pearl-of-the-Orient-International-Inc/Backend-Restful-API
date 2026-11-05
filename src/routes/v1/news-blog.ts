import { Router } from 'express';
import { archiveNewsBlog } from '@/controllers/v1/news-blog/archive-news-blog';
import { createNewsBlog } from '@/controllers/v1/news-blog/create-news-blog';
import { deleteNewsBlog } from '@/controllers/v1/news-blog/delete-news-blog';
import { getAllNewsBlogs } from '@/controllers/v1/news-blog/get-all-news-blogs';
import { getNewsBlogById } from '@/controllers/v1/news-blog/get-news-blog-by-id';
import { getPublicNewsBlogById } from '@/controllers/v1/news-blog/get-public-news-blog-by-id';
import { getPublicNewsBlogs } from '@/controllers/v1/news-blog/get-public-news-blogs';
import { publishNewsBlog } from '@/controllers/v1/news-blog/publish-news-blog';
import { retrieveNewsBlog } from '@/controllers/v1/news-blog/retrieve-news-blog';
import { updateNewsBlog } from '@/controllers/v1/news-blog/update-news-blog';
import {
  getFacebookPageConfiguration,
  getFacebookPageSyncCredentials,
  updateFacebookPageConfiguration,
} from '@/controllers/v1/news-blog/facebook-page-configuration';
import { validate } from '@/common/sanitation';
import { UserType } from '@/generated/prisma/enums';
import { createUploadthingExpressHandler } from '@/lib/uploadthing';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  createNewsBlogSchema,
  getAllNewsBlogsSchema,
  updateNewsBlogSchema,
  updateFacebookPageConfigurationSchema,
} from '@/validators/news-blog';

const router = Router();

router.use(
  '/media/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '8MB',
    maxFileCount: 10,
  }),
);

router.get('/public', expressRateLimit('basic'), getPublicNewsBlogs);

router.get('/public/:id', expressRateLimit('basic'), getPublicNewsBlogById);

router.get(
  '/facebook-page-configuration',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getFacebookPageConfiguration,
);
router.put(
  '/facebook-page-configuration',
  expressRateLimit('auth'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateFacebookPageConfigurationSchema),
  updateFacebookPageConfiguration,
);
router.get(
  '/facebook-page-configuration/sync-credentials',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getFacebookPageSyncCredentials,
);

router.post(
  '/create',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createNewsBlogSchema),
  createNewsBlog,
);

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllNewsBlogsSchema),
  getAllNewsBlogs,
);

router.get(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getNewsBlogById,
);

router.put(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateNewsBlogSchema),
  updateNewsBlog,
);

router.patch(
  '/:id/publish',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  publishNewsBlog,
);

router.patch(
  '/:id/archive',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  archiveNewsBlog,
);

router.patch(
  '/:id/retrieve',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  retrieveNewsBlog,
);

router.delete(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  deleteNewsBlog,
);

export default router;
