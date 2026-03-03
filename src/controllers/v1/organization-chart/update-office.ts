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
import { OfficeTitleLevel } from '@/generated/prisma/enums';

/**
 * Types & Validators
 */
import type { Request, Response } from 'express';
import {
  type UpdateOfficeSchema,
} from '@/validators/organization-chart';

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

    const { title, description, sections, level, maxSlots } = req.body as
      UpdateOfficeSchema & {
        level?: OfficeTitleLevel;
        maxSlots?: number | null;
      };

    // Check if office exists
    const existingOffice = await prisma.officeTitle.findUnique({
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

      const duplicateOffice = await prisma.officeTitle.findFirst({
        where: {
          name: {
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
      name?: string;
      description?: string;
      sections?: any;
      level?: OfficeTitleLevel;
      maxSlots?: number | null;
    } = {};

    // Sanitize and add title if provided
    if (title) {
      updateData.name = sanitizeText(title);
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

    if (level) {
      updateData.level = level;
    }

    if (maxSlots !== undefined) {
      updateData.maxSlots = maxSlots;
    }

    // Update the office
    const updatedOffice = await prisma.officeTitle.update({
      where: { id },
      data: updateData,
    });

    const { name, ...officePayload } = updatedOffice;

    logger.info('Office updated successfully', {
      officeId: updatedOffice.id,
      title: updatedOffice.name,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Office updated successfully',
      data: {
        ...officePayload,
        title: name,
      },
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
