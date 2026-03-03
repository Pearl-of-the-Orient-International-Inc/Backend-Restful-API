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
import type { CreateOfficeTitleSchema } from '@/validators/office-title';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

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

const sanitizeRichText = (content: string): string => {
  return DOMPurify.sanitize(content, purifyConfig);
};

const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
};

export const createOfficeTitle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    name,
    title,
    level,
    description,
    maxSlots,
    sections,
  } = req.body as CreateOfficeTitleSchema;

  const rawName = name ?? title;
  const sanitizedName = sanitizeText(rawName as string);
  const sanitizedDescription =
    description === null || description === undefined
      ? null
      : sanitizeText(description);

  try {
    const existingOffice = await prisma.officeTitle.findFirst({
      where: {
        name: {
          equals: sanitizedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingOffice) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'CONFLICT',
        message: `Office title "${sanitizedName}" already exists`,
      });
      return;
    }

    const sanitizedSections = (sections ?? []).map((section) => {
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

    const officeTitle = await prisma.officeTitle.create({
      data: {
        name: sanitizedName,
        level,
        description: sanitizedDescription,
        maxSlots: maxSlots ?? null,
        sections: sanitizedSections,
      },
    });

    logger.info('Office title created successfully', {
      officeTitleId: officeTitle.id,
      name: officeTitle.name,
      level: officeTitle.level,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Office title created successfully',
      data: officeTitle,
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during creation of office title', err);
  }
};
