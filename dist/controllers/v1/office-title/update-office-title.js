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
exports.updateOfficeTitle = void 0;
const crypto_1 = require("crypto");
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const http_codes_1 = require("@/common/http-codes");
const prisma_1 = require("@/lib/prisma");
const winston_1 = require("@/lib/winston");
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
const updateOfficeTitle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id || typeof id !== 'string') {
            res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                code: 'BAD_REQUEST',
                message: 'Valid Office Title ID is required',
            });
            return;
        }
        const { name, title, level, description, maxSlots, isPublic, sortOrder, reportsToId, sections, } = req.body;
        const existingOffice = yield prisma_1.prisma.officeTitle.findUnique({
            where: { id },
        });
        if (!existingOffice) {
            res.status(http_codes_1.HTTPSTATUS.NOT_FOUND).json({
                code: 'NOT_FOUND',
                message: 'Office title not found',
            });
            return;
        }
        const nextName = name !== null && name !== void 0 ? name : title;
        if (nextName) {
            const sanitizedName = sanitizeText(nextName);
            const duplicateOffice = yield prisma_1.prisma.officeTitle.findFirst({
                where: {
                    name: {
                        equals: sanitizedName,
                        mode: 'insensitive',
                    },
                    id: {
                        not: id,
                    },
                },
            });
            if (duplicateOffice) {
                res.status(http_codes_1.HTTPSTATUS.CONFLICT).json({
                    code: 'CONFLICT',
                    message: `Office title "${sanitizedName}" already exists`,
                });
                return;
            }
        }
        const updateData = {};
        if (nextName !== undefined) {
            updateData.name = sanitizeText(nextName);
        }
        if (level !== undefined) {
            updateData.level = level;
        }
        if (description !== undefined) {
            updateData.description =
                description === null ? null : sanitizeText(description);
        }
        if (maxSlots !== undefined) {
            updateData.maxSlots = maxSlots;
        }
        if (isPublic !== undefined)
            updateData.isPublic = isPublic;
        if (sortOrder !== undefined)
            updateData.sortOrder = sortOrder;
        if (reportsToId !== undefined) {
            if (reportsToId === id) {
                res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                    code: 'BAD_REQUEST',
                    message: 'An office cannot report to itself',
                });
                return;
            }
            if (reportsToId) {
                const reportingOffice = yield prisma_1.prisma.officeTitle.findUnique({
                    where: { id: reportsToId },
                    select: { id: true, reportsToId: true },
                });
                if (!reportingOffice) {
                    res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                        code: 'BAD_REQUEST',
                        message: 'The selected reporting office does not exist',
                    });
                    return;
                }
                let ancestorId = reportingOffice.reportsToId;
                while (ancestorId) {
                    if (ancestorId === id) {
                        res.status(http_codes_1.HTTPSTATUS.BAD_REQUEST).json({
                            code: 'BAD_REQUEST',
                            message: 'This reporting assignment would create a cycle',
                        });
                        return;
                    }
                    const ancestor = yield prisma_1.prisma.officeTitle.findUnique({
                        where: { id: ancestorId },
                        select: { reportsToId: true },
                    });
                    ancestorId = (_a = ancestor === null || ancestor === void 0 ? void 0 : ancestor.reportsToId) !== null && _a !== void 0 ? _a : null;
                }
            }
            updateData.reportsToId = reportsToId;
        }
        if (sections !== undefined) {
            updateData.sections = sections.map((section) => {
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
        }
        const updatedOffice = yield prisma_1.prisma.officeTitle.update({
            where: { id },
            data: updateData,
        });
        winston_1.logger.info('Office title updated successfully', {
            officeTitleId: updatedOffice.id,
            name: updatedOffice.name,
        });
        res.status(http_codes_1.HTTPSTATUS.OK).json({
            code: 'OK',
            message: 'Office title updated successfully',
            data: updatedOffice,
        });
    }
    catch (err) {
        res.status(http_codes_1.HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        });
        winston_1.logger.error('Error during office title update', err);
    }
});
exports.updateOfficeTitle = updateOfficeTitle;
