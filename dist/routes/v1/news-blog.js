"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const archive_news_blog_1 = require("@/controllers/v1/news-blog/archive-news-blog");
const create_news_blog_1 = require("@/controllers/v1/news-blog/create-news-blog");
const delete_news_blog_1 = require("@/controllers/v1/news-blog/delete-news-blog");
const get_all_news_blogs_1 = require("@/controllers/v1/news-blog/get-all-news-blogs");
const get_news_blog_by_id_1 = require("@/controllers/v1/news-blog/get-news-blog-by-id");
const get_public_news_blog_by_id_1 = require("@/controllers/v1/news-blog/get-public-news-blog-by-id");
const get_public_news_blogs_1 = require("@/controllers/v1/news-blog/get-public-news-blogs");
const publish_news_blog_1 = require("@/controllers/v1/news-blog/publish-news-blog");
const retrieve_news_blog_1 = require("@/controllers/v1/news-blog/retrieve-news-blog");
const update_news_blog_1 = require("@/controllers/v1/news-blog/update-news-blog");
const sanitation_1 = require("@/common/sanitation");
const enums_1 = require("@/generated/prisma/enums");
const uploadthing_1 = require("@/lib/uploadthing");
const authentication_1 = require("@/middlewares/authentication");
const authorization_1 = __importDefault(require("@/middlewares/authorization"));
const express_rate_limiter_1 = require("@/middlewares/express-rate-limiter");
const news_blog_1 = require("@/validators/news-blog");
const router = (0, express_1.Router)();
router.use('/media/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '8MB',
    maxFileCount: 10,
}));
router.get('/public', (0, express_rate_limiter_1.expressRateLimit)('basic'), get_public_news_blogs_1.getPublicNewsBlogs);
router.get('/public/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), get_public_news_blog_by_id_1.getPublicNewsBlogById);
router.post('/create', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(news_blog_1.createNewsBlogSchema), create_news_blog_1.createNewsBlog);
router.get('/', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(news_blog_1.getAllNewsBlogsSchema), get_all_news_blogs_1.getAllNewsBlogs);
router.get('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), get_news_blog_by_id_1.getNewsBlogById);
router.put('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(news_blog_1.updateNewsBlogSchema), update_news_blog_1.updateNewsBlog);
router.patch('/:id/publish', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), publish_news_blog_1.publishNewsBlog);
router.patch('/:id/archive', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), archive_news_blog_1.archiveNewsBlog);
router.patch('/:id/retrieve', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), retrieve_news_blog_1.retrieveNewsBlog);
router.delete('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), delete_news_blog_1.deleteNewsBlog);
exports.default = router;
