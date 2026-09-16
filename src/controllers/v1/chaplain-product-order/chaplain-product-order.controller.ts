import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import {
  ChaplainOrderPaymentMethod,
  ChaplainOrderPaymentStatus,
  ChaplainOrderStatus,
  PaymentGateway,
} from '@/generated/prisma/enums';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { calculatePlatformFee } from '@/lib/payment-fees';
import { logger } from '@/lib/winston';
import type { CreateChaplainProductOrderBody } from '@/validators/chaplain-product-order';

const orderInclude = {
  product: true,
  customerUser: {
    select: { id: true, name: true, email: true },
  },
  paymentTransactions: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.ChaplainProductOrderInclude;

type OrderWithRelations = Prisma.ChaplainProductOrderGetPayload<{
  include: typeof orderInclude;
}>;

const serializeOrder = (order: OrderWithRelations) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  productId: order.productId,
  product: {
    id: order.product.id,
    name: order.product.name,
    slug: order.product.slug,
    imageUrl: order.product.imageUrl,
  },
  quantity: order.quantity,
  unitPrice: Number(order.unitPrice),
  subtotal: Number(order.subtotal),
  taxAmount: Number(order.taxAmount),
  platformFee: Number(order.platformFee),
  total: Number(order.total),
  customerUser: order.customerUser,
  customerName: order.customerName,
  customerEmail: order.customerEmail,
  customerPhone: order.customerPhone,
  fulfillmentMethod: order.fulfillmentMethod,
  deliveryAddress: order.deliveryAddress,
  customerNotes: order.customerNotes,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  paymentGateway: order.paymentGateway,
  providerCheckoutId: order.providerCheckoutId,
  providerCheckoutUrl: order.providerCheckoutUrl,
  latestPayment: order.paymentTransactions[0]
    ? {
        id: order.paymentTransactions[0].id,
        reference: order.paymentTransactions[0].reference,
        amount: Number(order.paymentTransactions[0].amount),
        currency: order.paymentTransactions[0].currency,
        purpose: order.paymentTransactions[0].purpose,
        gateway: order.paymentTransactions[0].gateway,
        gatewayReference: order.paymentTransactions[0].gatewayReference,
        status: order.paymentTransactions[0].status,
        providerStatus: order.paymentTransactions[0].providerStatus,
        failureReason: order.paymentTransactions[0].failureReason,
        paidAt: order.paymentTransactions[0].paidAt,
        expiresAt: order.paymentTransactions[0].expiresAt,
        createdAt: order.paymentTransactions[0].createdAt,
      }
    : null,
  status: order.status,
  inventoryReleasedAt: order.inventoryReleasedAt,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const orderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `CP-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
};

const getId = (req: Request) => {
  const id = req.params.id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
};

export const createChaplainProductOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const body = req.body as CreateChaplainProductOrderBody;
    const order = await prisma.$transaction(async (tx) => {
      const product = await tx.chaplainProduct.findFirst({
        where: { id: body.productId, isActive: true },
      });

      if (!product) {
        throw new Error('PRODUCT_UNAVAILABLE');
      }

      const reserved = await tx.chaplainProduct.updateMany({
        where: {
          id: product.id,
          isActive: true,
          stockQuantity: { gte: body.quantity },
        },
        data: { stockQuantity: { decrement: body.quantity } },
      });

      if (reserved.count !== 1) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const unitPrice = Number(product.price);
      const subtotal = Number((unitPrice * body.quantity).toFixed(2));
      const taxAmount = Number((subtotal * 0.12).toFixed(2));
      const gateway =
        body.paymentMethod === ChaplainOrderPaymentMethod.ONLINE
          ? (body.paymentGateway as PaymentGateway)
          : null;
      const platformFee = calculatePlatformFee(subtotal + taxAmount, gateway);
      const total = Number((subtotal + taxAmount + platformFee).toFixed(2));

      return tx.chaplainProductOrder.create({
        data: {
          orderNumber: orderNumber(),
          productId: product.id,
          quantity: body.quantity,
          unitPrice,
          subtotal,
          taxAmount,
          platformFee,
          total,
          customerUserId: req.userId ?? null,
          customerName: body.customerName,
          customerEmail: body.customerEmail.toLowerCase(),
          customerPhone: body.customerPhone,
          fulfillmentMethod: body.fulfillmentMethod,
          deliveryAddress:
            body.fulfillmentMethod === 'DELIVERY'
              ? body.deliveryAddress?.trim() || null
              : null,
          customerNotes: body.customerNotes?.trim() || null,
          paymentMethod: body.paymentMethod,
          paymentGateway: gateway,
        },
        include: orderInclude,
      });
    });

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Chaplain product order submitted successfully',
      data: {
        ...serializeOrder(order),
        checkoutToken: order.checkoutToken,
      },
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === 'PRODUCT_UNAVAILABLE' ||
        err.message === 'INSUFFICIENT_STOCK')
    ) {
      res.status(HTTPSTATUS.CONFLICT).json({
        code: 'INSUFFICIENT_STOCK',
        message:
          err.message === 'PRODUCT_UNAVAILABLE'
            ? 'This product is no longer available'
            : 'The requested quantity is no longer available',
      });
      return;
    }
    logger.error('Error while creating chaplain product order', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const getOrderCheckoutContext = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getId(req);
    const checkoutToken = String(req.body.checkoutToken ?? '');
    const order = id
      ? await prisma.chaplainProductOrder.findFirst({
          where: {
            id,
            checkoutToken,
            paymentMethod: ChaplainOrderPaymentMethod.ONLINE,
            paymentStatus: ChaplainOrderPaymentStatus.PENDING,
            status: ChaplainOrderStatus.PENDING,
          },
          include: { product: true },
        })
      : null;

    if (!order) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Eligible order checkout was not found',
      });
      return;
    }

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Order checkout context retrieved successfully',
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        productName: order.product.name,
        quantity: order.quantity,
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        total: Number(order.total),
        customerEmail: order.customerEmail,
      },
    });
  } catch (err) {
    logger.error('Error while retrieving order checkout context', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const attachOrderPaymentSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getId(req);
    if (!id) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ code: 'BAD_REQUEST', message: 'Order ID is required' });
      return;
    }

    const updated = await prisma.chaplainProductOrder.updateMany({
      where: {
        id,
        checkoutToken: String(req.body.checkoutToken ?? ''),
        paymentMethod: ChaplainOrderPaymentMethod.ONLINE,
        paymentStatus: ChaplainOrderPaymentStatus.PENDING,
      },
      data: {
        providerCheckoutId: String(req.body.providerCheckoutId),
        providerCheckoutUrl: String(req.body.providerCheckoutUrl),
      },
    });

    if (updated.count !== 1) {
      res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ code: 'NOT_FOUND', message: 'Eligible order was not found' });
      return;
    }

    res
      .status(HTTPSTATUS.OK)
      .json({ code: 'OK', message: 'Payment session attached successfully' });
  } catch (err) {
    logger.error('Error while attaching order payment session', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

export const getChaplainProductOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;
    const search = String(req.query.search ?? '').trim();
    const status = req.query.status as ChaplainOrderStatus | undefined;
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    const where: Prisma.ChaplainProductOrderWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                orderNumber: { contains: search, mode: 'insensitive' as const },
              },
              {
                customerName: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                customerEmail: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                product: {
                  name: { contains: search, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
    };

    const [totalCount, orders] = await Promise.all([
      prisma.chaplainProductOrder.count({ where }),
      prisma.chaplainProductOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: orderInclude,
      }),
    ]);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Chaplain product orders retrieved successfully',
      data: orders.map(serializeOrder),
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
    logger.error('Error while retrieving chaplain product orders', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};

const allowedTransitions: Record<ChaplainOrderStatus, ChaplainOrderStatus[]> = {
  PENDING: [
    ChaplainOrderStatus.PAID,
    ChaplainOrderStatus.PROCESSING,
    ChaplainOrderStatus.CANCELLED,
  ],
  PAID: [ChaplainOrderStatus.PROCESSING, ChaplainOrderStatus.REFUNDED],
  PROCESSING: [
    ChaplainOrderStatus.READY,
    ChaplainOrderStatus.CANCELLED,
    ChaplainOrderStatus.REFUNDED,
  ],
  READY: [
    ChaplainOrderStatus.COMPLETED,
    ChaplainOrderStatus.CANCELLED,
    ChaplainOrderStatus.REFUNDED,
  ],
  COMPLETED: [ChaplainOrderStatus.REFUNDED],
  CANCELLED: [],
  REFUNDED: [],
};

export const updateChaplainProductOrderStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getId(req);
    const nextStatus = req.body.status as ChaplainOrderStatus;
    if (!id) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ code: 'BAD_REQUEST', message: 'Order ID is required' });
      return;
    }

    const order = await prisma.chaplainProductOrder.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      res
        .status(HTTPSTATUS.NOT_FOUND)
        .json({ code: 'NOT_FOUND', message: 'Order not found' });
      return;
    }
    if (
      order.status !== nextStatus &&
      !allowedTransitions[order.status].includes(nextStatus)
    ) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'INVALID_STATUS_TRANSITION',
        message: `Order cannot move from ${order.status} to ${nextStatus}`,
      });
      return;
    }
    if (
      order.paymentMethod === ChaplainOrderPaymentMethod.ONLINE &&
      nextStatus === ChaplainOrderStatus.PAID &&
      order.paymentStatus !== ChaplainOrderPaymentStatus.PAID
    ) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'PAYMENT_NOT_VERIFIED',
        message:
          'Online orders can only be marked paid after a verified provider webhook',
      });
      return;
    }
    if (
      order.paymentMethod === ChaplainOrderPaymentMethod.ONLINE &&
      nextStatus === ChaplainOrderStatus.REFUNDED &&
      order.paymentStatus !== ChaplainOrderPaymentStatus.REFUNDED
    ) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'REFUND_NOT_VERIFIED',
        message:
          'Complete the refund with the payment provider before reconciling this order',
      });
      return;
    }

    const shouldReleaseInventory =
      (nextStatus === ChaplainOrderStatus.CANCELLED ||
        nextStatus === ChaplainOrderStatus.REFUNDED) &&
      !order.inventoryReleasedAt;

    const updated = await prisma.$transaction(async (tx) => {
      if (shouldReleaseInventory) {
        await tx.chaplainProduct.update({
          where: { id: order.productId },
          data: { stockQuantity: { increment: order.quantity } },
        });
      }

      return tx.chaplainProductOrder.update({
        where: { id },
        data: {
          status: nextStatus,
          ...(order.paymentMethod === ChaplainOrderPaymentMethod.CASH &&
          nextStatus === ChaplainOrderStatus.PAID
            ? { paymentStatus: ChaplainOrderPaymentStatus.PAID }
            : {}),
          ...(order.paymentMethod === ChaplainOrderPaymentMethod.CASH &&
          nextStatus === ChaplainOrderStatus.REFUNDED
            ? { paymentStatus: ChaplainOrderPaymentStatus.REFUNDED }
            : {}),
          ...(shouldReleaseInventory
            ? { inventoryReleasedAt: new Date() }
            : {}),
        },
        include: orderInclude,
      });
    });

    res.status(HTTPSTATUS.OK).json({
      code: 'OK',
      message: 'Order status updated successfully',
      data: serializeOrder(updated),
    });
  } catch (err) {
    logger.error('Error while updating chaplain product order status', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
};
