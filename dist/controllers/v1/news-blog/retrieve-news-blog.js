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
exports.retrieveNewsBlog = void 0;
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
const news_blog_shared_1 = require("./news-blog-shared");
const retrieveNewsBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newsBlogId = req.params.id;
        if (!newsBlogId || Array.isArray(newsBlogId)) {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Invalid news blog ID',
            });
            return;
        }
        const existingNewsBlog = (yield prisma_1.prisma.newsBlog.findUnique({
            where: { id: newsBlogId },
            select: { id: true, isActive: true },
        }));
        if (!existingNewsBlog) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'News blog not found',
            });
            return;
        }
        if (existingNewsBlog.isActive) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: 'News blog is already active',
            });
            return;
        }
        const retrievedNewsBlog = yield prisma_1.prisma.newsBlog.update({
            where: { id: newsBlogId },
            data: { isActive: true },
            include: news_blog_shared_1.newsBlogInclude,
        });
        winston_1.logger.info('News blog retrieved successfully', { newsBlogId });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'News blog retrieved successfully',
            data: (0, news_blog_shared_1.serializeNewsBlog)(retrievedNewsBlog),
        });
    }
    catch (err) {
        winston_1.logger.error('Error during news blog retrieval', err);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
    }
});
exports.retrieveNewsBlog = retrieveNewsBlog;
