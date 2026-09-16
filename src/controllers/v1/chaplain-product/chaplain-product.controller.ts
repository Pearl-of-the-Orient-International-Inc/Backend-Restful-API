import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import type { ChaplainProductBody } from '@/validators/chaplain-product';

type ProductRecord = Awaited<
  ReturnType<typeof prisma.chaplainProduct.findFirstOrThrow>
>;

const getStockStatus = (stockQuantity: number, lowStockThreshold: number) => {
  if (stockQuantity === 0) return 'OUT_OF_STOCK' as const;
  if (stockQuantity <= lowStockThreshold) return 'LOW_STOCK' as const;
  return 'IN_STOCK' as const;
};

const serializeProduct = (product: ProductRecord) => ({
  ...product,
  price: Number(product.price),
  stockStatus: getStockStatus(product.stockQuantity, product.lowStockThreshold),
  isAvailable: product.isActive && product.stockQuantity > 0,
});

const toWriteData = (body: ChaplainProductBody) => ({
  slug: body.slug,
  name: body.name,
  description: body.description?.trim() || null,
  category: body.category,
  price: body.price,
  stockQuantity: body.stockQuantity,
  lowStockThreshold: body.lowStockThreshold,
  imageUrl: body.imageUrl,
  imageFileName: body.imageFileName?.trim() || null,
  isActive: body.isActive,
  sortOrder: body.sortOrder,
});

const getIdentifier = (req: Request) => {
  const id = req.params.id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
};

export const getPublicChaplainProducts = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const products = await prisma.chaplainProduct.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public chaplain products retrieved successfully',
      data: products.map(serializeProduct),
    });
  } catch (err) {
    logger.error('Error while retrieving public chaplain products', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const getPublicChaplainProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const identifier = getIdentifier(req);
    if (!identifier) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ code: 'BAD_REQUEST', message: 'Product ID is required' });
      return;
    }

    const product = await prisma.chaplainProduct.findFirst({
      where: {
        isActive: true,
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });

    if (!product) {
      res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ code: 'NOT_FOUND', message: 'Product not found' });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Public chaplain product retrieved successfully',
      data: serializeProduct(product),
    });
  } catch (err) {
    logger.error('Error while retrieving public chaplain product', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const getChaplainProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;
    const search = String(req.query.search ?? '').trim();
    const category = req.query.category as
      | Prisma.EnumChaplainProductCategoryFilter
      | undefined;
    const isActive =
      req.query.isActive === 'true'
        ? true
        : req.query.isActive === 'false'
          ? false
          : undefined;
    const sortBy = String(req.query.sortBy ?? 'sortOrder');
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
    const allowedSortFields = new Set([
      'name',
      'price',
      'stockQuantity',
      'sortOrder',
      'createdAt',
      'updatedAt',
    ]);
    const orderField = allowedSortFields.has(sortBy) ? sortBy : 'sortOrder';
    const where: Prisma.ChaplainProductWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { slug: { contains: search, mode: 'insensitive' as const } },
              {
                description: { contains: search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
      ...(category ? { category: category as never } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    };

    const [totalCount, products] = await Promise.all([
      prisma.chaplainProduct.count({ where }),
      prisma.chaplainProduct.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ [orderField]: sortOrder }, { name: 'asc' }],
      }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Chaplain products retrieved successfully',
      data: products.map(serializeProduct),
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
    logger.error('Error while retrieving chaplain products', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const createChaplainProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const product = await prisma.chaplainProduct.create({
      data: toWriteData(req.body as ChaplainProductBody),
    });
    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Chaplain product created successfully',
      data: serializeProduct(product),
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      res
        .status(HTTPSTATUS.CONFLICT)
        .json({ code: 'CONFLICT', message: 'Product slug already exists' });
      return;
    }
    logger.error('Error while creating chaplain product', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const updateChaplainProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getIdentifier(req);
    if (!id) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ code: 'BAD_REQUEST', message: 'Product ID is required' });
      return;
    }
    const product = await prisma.chaplainProduct.update({
      where: { id },
      data: toWriteData(req.body as ChaplainProductBody),
    });
    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Chaplain product updated successfully',
      data: serializeProduct(product),
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      res
        .status(HTTPSTATUS.CONFLICT)
        .json({ code: 'CONFLICT', message: 'Product slug already exists' });
      return;
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ code: 'NOT_FOUND', message: 'Product not found' });
      return;
    }
    logger.error('Error while updating chaplain product', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const deleteChaplainProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getIdentifier(req);
    if (!id) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ code: 'BAD_REQUEST', message: 'Product ID is required' });
      return;
    }
    await prisma.chaplainProduct.delete({ where: { id } });
    res
      .status(HTTPSTATUS.OK)
      .json({ code: 'OK', message: 'Chaplain product deleted successfully' });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ code: 'NOT_FOUND', message: 'Product not found' });
      return;
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2003'
    ) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'PRODUCT_HAS_ORDERS',
        message:
          'This product has order history and cannot be deleted. Mark it inactive instead.',
      });
      return;
    }
    logger.error('Error while deleting chaplain product', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
