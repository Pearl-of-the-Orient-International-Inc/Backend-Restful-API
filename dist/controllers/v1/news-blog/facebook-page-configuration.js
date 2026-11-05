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
exports.getFacebookPageSyncCredentials = exports.updateFacebookPageConfiguration = exports.getFacebookPageConfiguration = void 0;
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const serialize = (item) => item
    ? {
        configured: true,
        pageId: item.pageId,
        tokenLastFour: item.accessToken.slice(-4),
        expiresAt: item.expiresAt,
        updatedAt: item.updatedAt,
    }
    : {
        configured: false,
        pageId: null,
        tokenLastFour: null,
        expiresAt: null,
        updatedAt: null,
    };
const getFacebookPageConfiguration = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield prisma_1.prisma.facebookPageConfiguration.findUnique({
            where: { id: 'default' },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({ code: 'OK', data: serialize(item) });
    }
    catch (error) {
        winston_1.logger.error('Unable to retrieve Facebook Page configuration', error);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to retrieve Facebook Page configuration.',
        });
    }
});
exports.getFacebookPageConfiguration = getFacebookPageConfiguration;
const updateFacebookPageConfiguration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pageId, accessToken, expiresAt } = req.body;
        const item = yield prisma_1.prisma.facebookPageConfiguration.upsert({
            where: { id: 'default' },
            create: {
                id: 'default',
                pageId,
                accessToken,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
            update: {
                pageId,
                accessToken,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Facebook Page configuration saved.',
            data: serialize(item),
        });
    }
    catch (error) {
        winston_1.logger.error('Unable to save Facebook Page configuration', error);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to save Facebook Page configuration.',
        });
    }
});
exports.updateFacebookPageConfiguration = updateFacebookPageConfiguration;
const getFacebookPageSyncCredentials = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield prisma_1.prisma.facebookPageConfiguration.findUnique({
            where: { id: 'default' },
        });
        if (!item) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Facebook Page sync is not configured yet.',
            });
            return;
        }
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            data: { pageId: item.pageId, accessToken: item.accessToken },
        });
    }
    catch (error) {
        winston_1.logger.error('Unable to retrieve Facebook Page sync credentials', error);
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unable to retrieve Facebook Page sync credentials.',
        });
    }
});
exports.getFacebookPageSyncCredentials = getFacebookPageSyncCredentials;
