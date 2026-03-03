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
import type { UpdateOfficeTitleSchema } from '@/validators/office-title';
import type { OfficeTitleLevel } from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';

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

export const updateOfficeTitle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || typeof id !== 'string') {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid Office Title ID is required',
      });
      return;
    }

    const {
      name,
      title,
      level,
      description,
      maxSlots,
      sections,
    } = req.body as UpdateOfficeTitleSchema;

    const existingOffice = await prisma.officeTitle.findUnique({
      where: { id },
    });

    if (!existingOffice) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Office title not found',
      });
      return;
    }

    const nextName = name ?? title;
    if (nextName) {
      const sanitizedName = sanitizeText(nextName);

      const duplicateOffice = await prisma.officeTitle.findFirst({
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
        res.status(HTTPSTATUS.CONFLICT).json({
          code: 'CONFLICT',
          message: `Office title "${sanitizedName}" already exists`,
        });
        return;
      }
    }

    const updateData: {
      name?: string;
      level?: OfficeTitleLevel;
      description?: string | null;
      maxSlots?: number | null;
      sections?: Prisma.InputJsonValue;
    } = {};

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

    if (sections !== undefined) {
      updateData.sections = sections.map((section) => {
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
    }

    const updatedOffice = await prisma.officeTitle.update({
      where: { id },
      data: updateData,
    });

    logger.info('Office title updated successfully', {
      officeTitleId: updatedOffice.id,
      name: updatedOffice.name,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Office title updated successfully',
      data: updatedOffice,
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during office title update', err);
  }
};
