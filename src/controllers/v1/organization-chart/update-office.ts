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
 * Types & Validators
 */
import type { Request, Response } from 'express';
import {
  updateOfficeSchema,
  type UpdateOfficeSchema,
} from '@/validators/organization-chart';
import { ZodError } from 'zod';

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

export const updateOffice = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Validate that ID is provided and is a string
    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid Office ID is required',
      });
      return;
    }

    const { title, description, sections } = req.body as UpdateOfficeSchema;

    // Check if office exists
    const existingOffice = await prisma.office.findUnique({
      where: { id },
    });

    if (!existingOffice) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Office not found',
      });
      return;
    }

    // If title is being updated, check for duplicates
    if (title) {
      const sanitizedTitle = sanitizeText(title);

      const duplicateOffice = await prisma.office.findFirst({
        where: {
          title: {
            equals: sanitizedTitle,
            mode: 'insensitive',
          },
          id: {
            not: id, // Exclude current office from duplicate check
          },
        },
      });

      if (duplicateOffice) {
        res.status(HTTPSTATUS.CONFLICT).json({
          code: 'CONFLICT',
          message: `Office with title "${sanitizedTitle}" already exists`,
        });
        return;
      }
    }

    // Build update data object
    const updateData: {
      title?: string;
      description?: string;
      sections?: any;
    } = {};

    // Sanitize and add title if provided
    if (title) {
      updateData.title = sanitizeText(title);
    }

    // Sanitize and add description if provided
    if (description) {
      updateData.description = sanitizeText(description);
    }

    // Sanitize and process sections if provided
    if (sections) {
      const sectionsWithIds = sections.map((section) => {
        const sanitizedSectionTitle = sanitizeText(section.title);

        // Handle richtext type
        if (section.type === 'richtext') {
          return {
            id: section.id || randomUUID(),
            title: sanitizedSectionTitle,
            type: section.type,
            content: section.content ? sanitizeRichText(section.content) : '',
          };
        }

        // Handle list type - sanitize each item
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

    // Update the office
    const updatedOffice = await prisma.office.update({
      where: { id },
      data: updateData,
    });

    logger.info('Office updated successfully', {
      officeId: updatedOffice.id,
      title: updatedOffice.title,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Office updated successfully',
      data: updatedOffice,
    });
  } catch (err) {
    // Response with 500 status code for unexpected server errors
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during office update', err);
  }
};
