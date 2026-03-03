/**
 * Node modules
 */
import { randomUUID } from 'crypto';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

/**
 * Custom modules
 */
import { HTTPSTATUS } from '@/common/http-codes';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';

/**
 * Types
 */
import type { Request, Response } from 'express';
import type { UpdateBranchServiceSchema } from '@/validators/branch-service';

/**
 * Initialize DOMPurify for sanitization
 */
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Configure DOMPurify to allow only safe HTML tags
 */
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

/**
 * Sanitize rich text content
 */
const sanitizeRichText = (content: string): string => {
  return DOMPurify.sanitize(content, purifyConfig);
};

/**
 * Sanitize plain text content (for list items)
 */
const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
};

export const updateBranchService = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid Branch Service ID is required',
      });
      return;
    }

    const { title, description, sections } = req.body as UpdateBranchServiceSchema;

    const existingBranchService = await prisma.branchOfService.findUnique({
      where: { id },
    });

    if (!existingBranchService) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Branch service not found',
      });
      return;
    }

    if (title) {
      const sanitizedTitle = sanitizeText(title);

      const duplicateBranchService = await prisma.branchOfService.findFirst({
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
        res.status(HTTPSTATUS.CONFLICT).json({
          code: 'CONFLICT',
          message: `Branch service with title "${sanitizedTitle}" already exists`,
        });
        return;
      }
    }

    const updateData: {
      title?: string;
      description?: string;
      sections?: any;
    } = {};

    if (title) {
      updateData.title = sanitizeText(title);
    }

    if (description) {
      updateData.description = sanitizeText(description);
    }

    if (sections) {
      const sectionsWithIds = sections.map((section) => {
        const sanitizedSectionTitle = sanitizeText(section.title);

        if (section.type === 'richtext') {
          return {
            id: section.id || randomUUID(),
            title: sanitizedSectionTitle,
            type: section.type,
            content: section.content ? sanitizeRichText(section.content) : '',
          };
        }

        return {
          id: section.id || randomUUID(),
          title: sanitizedSectionTitle,
          type: section.type,
          items:
            section.items?.map((item) => ({
              id: item.id || randomUUID(),
              content: sanitizeText(item.content),
            })) || [],
        };
      });

      updateData.sections = sectionsWithIds;
    }

    const updatedBranchService = await prisma.branchOfService.update({
      where: { id },
      data: updateData,
    });

    logger.info('Branch service updated successfully', {
      branchServiceId: updatedBranchService.id,
      title: updatedBranchService.title,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Branch service updated successfully',
      data: updatedBranchService,
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during branch service update', err);
  }
};
