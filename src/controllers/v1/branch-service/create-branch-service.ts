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
import { CreateBranchServiceSchema } from '@/validators/branch-service';

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

export const createBranchService = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { title, description, sections } = req.body as
    CreateBranchServiceSchema;

  // Sanitize title and description
  const sanitizedTitle = sanitizeText(title);
  const sanitizedDescription = sanitizeText(description);

  try {
    // Check if branchService with the same title already exists
    const existingBranchService = await prisma.branchOfService.findFirst({
      where: {
        title: {
          equals: sanitizedTitle,
          mode: 'insensitive', // Case-insensitive comparison
        },
      },
    });

    if (existingBranchService) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: `Branch of service with title "${sanitizedTitle}" already exists`,
      });
      return;
    }

    // Sanitize and generate IDs for sections and items
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
            content: sanitizeText(item.content), // Sanitize list item content
          })) || [],
      };
    });

    // Create the branch of service
    const branchService = await prisma.branchOfService.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        sections: sectionsWithIds,
      },
    });

    logger.info('Branch of service created successfully', {
      officeId: branchService.id,
      title: branchService.title,
    });

    const { title, ...officePayload } = branchService;

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Branch of service created successfully',
      data: {
        ...officePayload,
        title
      },
    });
  } catch (err) {
    // Response with 500 status code for unexpected server errors
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during creation of branch of services', err);
  }
};
