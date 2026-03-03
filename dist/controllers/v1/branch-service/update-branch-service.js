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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBranchService = void 0;
const crypto_1 = require("crypto");
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const http_codes_1 = require("../../../common/http-codes");
const prisma_1 = require("../../../lib/prisma");
const winston_1 = require("../../../lib/winston");
const window = new jsdom_1.JSDOM('').window;
const DOMPurify = (0, dompurify_1.default)(window);
const purifyConfig = {
    ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'blockquote',
        'a',
        'span',
        'div',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
};
const sanitizeRichText = (content) => {
    return DOMPurify.sanitize(content, purifyConfig);
};
const sanitizeText = (text) => {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
};
const updateBranchService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid Branch Service ID is required',
            });
            return;
        }
        const { title, description, sections } = req.body;
        const existingBranchService = yield prisma_1.prisma.branchOfService.findUnique({
            where: { id },
        });
        if (!existingBranchService) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Branch service not found',
            });
            return;
        }
        if (title) {
            const sanitizedTitle = sanitizeText(title);
            const duplicateBranchService = yield prisma_1.prisma.branchOfService.findFirst({
                where: {
                    title: {
                        equals: sanitizedTitle,
                        mode: 'insensitive',
                    },
                    id: {
                        not: id,
                    },
                },
            });
            if (duplicateBranchService) {
                res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                    code: 'CONFLICT',
                    message: `Branch service with title "${sanitizedTitle}" already exists`,
                });
                return;
            }
        }
        const updateData = {};
        if (title) {
            updateData.title = sanitizeText(title);
        }
        if (description) {
            updateData.description = sanitizeText(description);
        }
        if (sections) {
            const sectionsWithIds = sections.map((section) => {
                var _a;
                const sanitizedSectionTitle = sanitizeText(section.title);
                if (section.type === 'richtext') {
                    return {
                        id: section.id || (0, crypto_1.randomUUID)(),
                        title: sanitizedSectionTitle,
                        type: section.type,
                        content: section.content ? sanitizeRichText(section.content) : '',
                    };
                }
                return {
                    id: section.id || (0, crypto_1.randomUUID)(),
                    title: sanitizedSectionTitle,
                    type: section.type,
                    items: ((_a = section.items) === null || _a === void 0 ? void 0 : _a.map((item) => ({
                        id: item.id || (0, crypto_1.randomUUID)(),
                        content: sanitizeText(item.content),
                    }))) || [],
                };
            });
            updateData.sections = sectionsWithIds;
        }
        const updatedBranchService = yield prisma_1.prisma.branchOfService.update({
            where: { id },
            data: updateData,
        });
        winston_1.logger.info('Branch service updated successfully', {
            branchServiceId: updatedBranchService.id,
            title: updatedBranchService.title,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Branch service updated successfully',
            data: updatedBranchService,
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during branch service update', err);
    }
});
exports.updateBranchService = updateBranchService;
