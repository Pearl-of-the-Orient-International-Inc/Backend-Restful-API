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
exports.getPublicNewsBlogs = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const news_blog_shared_1 = require("./news-blog-shared");
const getPublicNewsBlogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const search = (_a = req.query.search) === null || _a === void 0 ? void 0 : _a.trim();
        const skip = (page - 1) * limit;
        const where = Object.assign({ status: enums_1.NewsBlogStatus.PUBLISHED, OR: [
                { publishedAt: null },
                { publishedAt: { lte: new Date() } },
            ] }, (search
            ? {
                AND: [
                    {
                        OR: [
                            { title: { contains: search, mode: 'insensitive' } },
                            { caption: { contains: search, mode: 'insensitive' } },
                            {
                                hashtags: {
                                    hasSome: [search, `#${search.replace(/^#/, '')}`],
                                },
                            },
                        ],
                    },
                ],
            }
            : {}));
        const [totalCount, newsBlogs] = yield Promise.all([
            prisma_1.prisma.newsBlog.count({ where }),
            prisma_1.prisma.newsBlog.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
                include: news_blog_shared_1.newsBlogInclude,
            }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        winston_1.logger.info('Public news blogs retrieved successfully', {
            count: newsBlogs.length,
            page,
            totalCount,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public news blogs retrieved successfully',
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
        winston_1.logger.error('Error during public news blogs retrieval', err);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicNewsBlogs = getPublicNewsBlogs;
