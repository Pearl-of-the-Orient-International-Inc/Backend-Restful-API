import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { MemberStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { CreateNewsBlogSchema } from '@/validators/news-blog';
import {
  buildNewsBlogWriteInput,
  newsBlogInclude,
  serializeNewsBlog,
} from './news-blog-shared';

export const createNewsBlog = async (req: Request, res: Response): Promise<void> => {
  const payload = req.body as CreateNewsBlogSchema;

  try {
    const taggedMemberIds = [...new Set(payload.taggedMemberIds ?? [])];

    if (taggedMemberIds.length) {
      const members = await prisma.member.findMany({
        where: {
          id: { in: taggedMemberIds },
          isActive: true,
          status: MemberStatus.APPROVED,
        },
        select: { id: true },
      });

      if (members.length !== taggedMemberIds.length) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
          code: 'BAD_REQUEST',
          message: 'Tagged members must be active approved members',
        });
        return;
      }
    }

    const newsBlog = await prisma.newsBlog.create({
      data: {
        ...buildNewsBlogWriteInput(payload),
        media: {
          create: payload.media.map((mediaItem, index) => ({
            kind: mediaItem.kind,
            fileUrl: mediaItem.fileUrl.trim(),
            fileName: mediaItem.fileName.trim(),
            sortOrder: index,
          })),
        },
        ...(taggedMemberIds.length
          ? {
              taggedMembers: {
                createMany: {
                  data: taggedMemberIds.map((memberId) => ({ memberId })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
      include: newsBlogInclude,
    });

    logger.info('News blog created successfully', {
      newsBlogId: newsBlog.id,
      title: newsBlog.title,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'News blog created successfully',
      data: serializeNewsBlog(newsBlog),
    });
  } catch (err) {
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    logger.error('Error during news blog creation', err);
  }
};
