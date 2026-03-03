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
exports.createOfficeTitle = void 0;
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
const createOfficeTitle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, title, level, description, maxSlots, sections, } = req.body;
    const rawName = name !== null && name !== void 0 ? name : title;
    const sanitizedName = sanitizeText(rawName);
    const sanitizedDescription = description === null || description === undefined
        ? null
        : sanitizeText(description);
    try {
        const existingOffice = yield prisma_1.prisma.officeTitle.findFirst({
            where: {
                name: {
                    equals: sanitizedName,
                    mode: 'insensitive',
                },
            },
        });
        if (existingOffice) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: `Office title "${sanitizedName}" already exists`,
            });
            return;
        }
        const sanitizedSections = (sections !== null && sections !== void 0 ? sections : []).map((section) => {
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
        const officeTitle = yield prisma_1.prisma.officeTitle.create({
            data: {
                name: sanitizedName,
                level,
                description: sanitizedDescription,
                maxSlots: maxSlots !== null && maxSlots !== void 0 ? maxSlots : null,
                sections: sanitizedSections,
            },
        });
        winston_1.logger.info('Office title created successfully', {
            officeTitleId: officeTitle.id,
            name: officeTitle.name,
            level: officeTitle.level,
        });
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Office title created successfully',
            data: officeTitle,
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during creation of office title', err);
    }
});
exports.createOfficeTitle = createOfficeTitle;
