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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBranchService = void 0;
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
const createBranchService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, sections } = req.body;
    const sanitizedTitle = sanitizeText(title);
    const sanitizedDescription = sanitizeText(description);
    try {
        const existingBranchService = yield prisma_1.prisma.branchOfService.findFirst({
            where: {
                title: {
                    equals: sanitizedTitle,
                    mode: 'insensitive',
                },
            },
        });
        if (existingBranchService) {
            res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                code: 'CONFLICT',
                message: `Branch of service with title "${sanitizedTitle}" already exists`,
            });
            return;
        }
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
        const branchService = yield prisma_1.prisma.branchOfService.create({
            data: {
                title: sanitizedTitle,
                description: sanitizedDescription,
                sections: sectionsWithIds,
            },
        });
        winston_1.logger.info('Branch of service created successfully', {
            officeId: branchService.id,
            title: branchService.title,
        });
        const { title } = branchService, officePayload = __rest(branchService, ["title"]);
        res.status(http_codes_1.HTTPSTATUS.CREATED).json({
            code: 'CREATED',
            message: 'Branch of service created successfully',
            data: Object.assign(Object.assign({}, officePayload), { title }),
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during creation of branch of services', err);
    }
});
exports.createBranchService = createBranchService;
