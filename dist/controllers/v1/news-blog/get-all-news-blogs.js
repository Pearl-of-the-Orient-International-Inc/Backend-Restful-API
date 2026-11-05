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
exports.getAllNewsBlogs = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const news_blog_shared_1 = require("./news-blog-shared");
const getAllNewsBlogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.trim();
        const status = req.query.status;
        const sortBy = req.query.sortBy || 'updatedAt';
        const sortOrder = req.query.sortOrder || 'desc';
        const skip = (page - 1) * limit;
        const orderByFieldMap = {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
            scheduledAt: 'scheduledAt',
            title: 'title',
        };
        const orderByField = orderByFieldMap[sortBy] || 'updatedAt';
        const where = Object.assign(Object.assign({}, (search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { caption: { contains: search, mode: 'insensitive' } },
                    { hashtags: { hasSome: [search, `#${search.replace(/^#/, '')}`] } },
                ],
            }
            : {})), (status ? { status } : {}));
        const [totalCount, newsBlogs] = yield Promise.all([
            prisma_1.prisma.newsBlog.count({ where }),
            prisma_1.prisma.newsBlog.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [orderByField]: sortOrder,
                },
                include: news_blog_shared_1.newsBlogInclude,
            }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        winston_1.logger.info('News blogs retrieved successfully', {
            count: newsBlogs.length,
            page,
            totalCount,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'News blogs retrieved successfully',
            data: newsBlogs.map(news_blog_shared_1.serializeNewsBlog),
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during news blogs retrieval', err);
    }
});
exports.getAllNewsBlogs = getAllNewsBlogs;
