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
exports.getPublicNewsBlogById = void 0;
const http_codes_1 = require("@/common/http-codes");
const enums_1 = require("@/generated/prisma/enums");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const news_blog_shared_1 = require("./news-blog-shared");
const getPublicNewsBlogById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid News Blog ID is required',
            });
            return;
        }
        const newsBlog = yield prisma_1.prisma.newsBlog.findFirst({
            where: {
                id,
                status: enums_1.NewsBlogStatus.PUBLISHED,
                OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
            },
            include: news_blog_shared_1.newsBlogInclude,
        });
        if (!newsBlog) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'News blog not found',
            });
            return;
        }
        winston_1.logger.info('Public news blog retrieved successfully', {
            newsBlogId: newsBlog.id,
            title: newsBlog.title,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Public news blog retrieved successfully',
            data: (0, news_blog_shared_1.serializeNewsBlog)(newsBlog),
        });
    }
    catch (err) {
        winston_1.logger.error('Error during public news blog retrieval', err);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.getPublicNewsBlogById = getPublicNewsBlogById;
