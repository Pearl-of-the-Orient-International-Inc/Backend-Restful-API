import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { BulletinEntryStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { BulletinEntryBody } from '@/validators/bulletin-entry';

const bulletinEntryInclude = {
  authorUser: {
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  },
} satisfies Prisma.BulletinEntryInclude;

const trimToNull = (value?: string | null) => value?.trim() || null;

const promoteScheduledEntries = () =>
  prisma.bulletinEntry.updateMany({
    where: {
      status: BulletinEntryStatus.SCHEDULED,
      scheduledAt: { lte: new Date() },
    },
    data: {
      status: BulletinEntryStatus.PUBLISHED,
      publicationDate: new Date(),
    },
  });

const buildWriteData = (
  body: BulletinEntryBody,
): Prisma.BulletinEntryUncheckedCreateInput => {
  const status = body.status ?? BulletinEntryStatus.DRAFT;

  return {
    title: body.title.trim(),
    content: body.content.trim(),
    type: body.type,
    status,
    publicationDate:
      status === BulletinEntryStatus.PUBLISHED
        ? body.publicationDate
          ? new Date(body.publicationDate)
          : new Date()
        : body.publicationDate
          ? new Date(body.publicationDate)
          : null,
    scheduledAt:
      status === BulletinEntryStatus.SCHEDULED && body.scheduledAt
        ? new Date(body.scheduledAt)
        : null,
    authorName: trimToNull(body.authorName),
    issuingOffice: trimToNull(body.issuingOffice),
    featuredImageUrl: trimToNull(body.featuredImageUrl),
    featuredImageFileName: trimToNull(body.featuredImageFileName),
    attachmentUrl: trimToNull(body.attachmentUrl),
    attachmentFileName: trimToNull(body.attachmentFileName),
    attachmentMimeType: trimToNull(body.attachmentMimeType),
  };
};

const getId = (req: Request) => {
  const id = req.params.id;
  return typeof id === 'string' ? id : null;
};

export const getBulletinEntries = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await promoteScheduledEntries();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = String(req.query.search ?? '').trim();
    const type = req.query.type as
      | Prisma.EnumBulletinEntryTypeFilter
      | undefined;
    const status = req.query.status as BulletinEntryStatus | undefined;
    const sortBy = String(req.query.sortBy ?? 'updatedAt');
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    const allowedSortFields = new Set([
      'createdAt',
      'updatedAt',
      'publicationDate',
      'scheduledAt',
      'title',
    ]);
    const orderField = allowedSortFields.has(sortBy) ? sortBy : 'updatedAt';
    const where: Prisma.BulletinEntryWhereInput = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { content: { contains: search, mode: 'insensitive' as const } },
              {
                issuingOffice: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(type ? { type: type as never } : {}),
      ...(status ? { status } : {}),
    };

    const [totalCount, entries] = await Promise.all([
      prisma.bulletinEntry.count({ where }),
      prisma.bulletinEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: bulletinEntryInclude,
      }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Bulletin entries retrieved successfully',
      data: entries,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    logger.error('Error while retrieving bulletin entries', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const getPublicBulletinEntries = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    await promoteScheduledEntries();
    const entries = await prisma.bulletinEntry.findMany({
      where: {
        status: BulletinEntryStatus.PUBLISHED,
        publicationDate: { lte: new Date() },
      },
      orderBy: { publicationDate: 'desc' },
      include: bulletinEntryInclude,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Published bulletin entries retrieved successfully',
      data: entries,
    });
  } catch (err) {
    logger.error('Error while retrieving public bulletin entries', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const getPublicBulletinEntry = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await promoteScheduledEntries();
    const id = getId(req);

    if (!id) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid bulletin entry ID is required',
      });
      return;
    }

    const entry = await prisma.bulletinEntry.findFirst({
      where: {
        id,
        status: BulletinEntryStatus.PUBLISHED,
        publicationDate: { lte: new Date() },
      },
      include: bulletinEntryInclude,
    });

    if (!entry) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Published bulletin entry not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Published bulletin entry retrieved successfully',
      data: entry,
    });
  } catch (err) {
    logger.error('Error while retrieving public bulletin entry', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const createBulletinEntry = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as BulletinEntryBody;
    const entry = await prisma.bulletinEntry.create({
      data: {
        ...buildWriteData(body),
        authorUserId: req.userId,
      },
      include: bulletinEntryInclude,
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Bulletin entry created successfully',
      data: entry,
    });
  } catch (err) {
    logger.error('Error while creating bulletin entry', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const updateBulletinEntry = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getId(req);
    if (!id) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'BAD_REQUEST',
        message: 'Valid bulletin entry ID is required',
      });
      return;
    }

    const body = req.body as BulletinEntryBody;
    const entry = await prisma.bulletinEntry.update({
      where: { id },
      data: buildWriteData(body),
      include: bulletinEntryInclude,
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Bulletin entry updated successfully',
      data: entry,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Bulletin entry not found',
      });
      return;
    }
    logger.error('Error while updating bulletin entry', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

const updateStatus = async (
  req: Request,
  res: Response,
  status: BulletinEntryStatus,
  message: string,
) => {
  const id = getId(req);
  if (!id) {
    res.status(HTTPSTATUS.BAD_REQUEST).json({
      code: 'BAD_REQUEST',
      message: 'Valid bulletin entry ID is required',
    });
    return;
  }

  try {
    const entry = await prisma.bulletinEntry.update({
      where: { id },
      data: {
        status,
        ...(status === BulletinEntryStatus.PUBLISHED
          ? { publicationDate: new Date(), scheduledAt: null }
          : {}),
        ...(status === BulletinEntryStatus.UNPUBLISHED ||
        status === BulletinEntryStatus.ARCHIVED ||
        status === BulletinEntryStatus.DRAFT
          ? { scheduledAt: null }
          : {}),
      },
      include: bulletinEntryInclude,
    });
    res.status(HTTPSTATUS.OK).json({ code: 'OK', message, data: entry });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Bulletin entry not found',
      });
      return;
    }
    logger.error(`Error while changing bulletin entry status to ${status}`, {
      err,
    });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const publishBulletinEntry = (req: Request, res: Response) =>
  updateStatus(
    req,
    res,
    BulletinEntryStatus.PUBLISHED,
    'Bulletin entry published successfully',
  );

export const unpublishBulletinEntry = (req: Request, res: Response) =>
  updateStatus(
    req,
    res,
    BulletinEntryStatus.UNPUBLISHED,
    'Bulletin entry unpublished successfully',
  );

export const archiveBulletinEntry = (req: Request, res: Response) =>
  updateStatus(
    req,
    res,
    BulletinEntryStatus.ARCHIVED,
    'Bulletin entry archived successfully',
  );

export const restoreBulletinEntry = (req: Request, res: Response) =>
  updateStatus(
    req,
    res,
    BulletinEntryStatus.DRAFT,
    'Bulletin entry restored as a draft',
  );
