import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { HTTPSTATUS } from '@/common/http-codes';
import config from '@/config';
import {
  ChaplainOrderPaymentMethod,
  ChaplainOrderPaymentStatus,
  ChaplainOrderStatus,
  PaymentGateway,
  PaymentPurpose,
  PaymentTransactionStatus,
} from '@/generated/prisma/enums';
import {
  capturePayPalOrder,
  createPayPalCheckout,
  createXenditCheckout,
  getPayPalAccessToken,
} from '@/lib/payment-gateways';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/winston';
import { paymentFeePolicies } from '@/lib/payment-fees';

export const getPublicPaymentFeePolicies = (
  _req: Request,
  res: Response,
): void => {
  res.status(HTTPSTATUS.OK).json({
    code: 'OK',
    message: 'Payment fee policies retrieved successfully',
    data: paymentFeePolicies,
  });
};

const safeEqual = (received: string, expected?: string) => {
  if (!expected) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
};

const paymentReference = () =>
  `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 10).toUpperCase()}`;

const syncPaidTransaction = async (
  gatewayReference: string,
  providerStatus: string,
  providerAmount?: number,
  providerCurrency?: string,
) => {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { gatewayReference },
  });
  if (!transaction || transaction.status === PaymentTransactionStatus.PAID)
    return;
  if (
    (providerAmount !== undefined &&
      Number(transaction.amount) !== providerAmount) ||
    (providerCurrency !== undefined &&
      transaction.currency !== providerCurrency)
  ) {
    throw new Error('Provider payment amount or currency does not match');
  }

  await prisma.$transaction([
    prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentTransactionStatus.PAID,
        providerStatus,
        paidAt: new Date(),
      },
    }),
    ...(transaction.chaplainProductOrderId
      ? [
          prisma.chaplainProductOrder.update({
            where: { id: transaction.chaplainProductOrderId },
            data: {
              paymentStatus: ChaplainOrderPaymentStatus.PAID,
              status: ChaplainOrderStatus.PAID,
            },
          }),
        ]
      : []),
  ]);
};

const syncNonPaidTransaction = async (
  gatewayReference: string,
  status: PaymentTransactionStatus,
  providerStatus: string,
  failureReason?: string,
) => {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { gatewayReference },
  });
  if (!transaction || transaction.status === PaymentTransactionStatus.PAID)
    return;
  const orderPaymentStatus = status as ChaplainOrderPaymentStatus;
  await prisma.$transaction([
    prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status, providerStatus, failureReason },
    }),
    ...(transaction.chaplainProductOrderId
      ? [
          prisma.chaplainProductOrder.update({
            where: { id: transaction.chaplainProductOrderId },
            data: { paymentStatus: orderPaymentStatus },
          }),
        ]
      : []),
  ]);
};

export const initiateChaplainOrderPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  let transactionId: string | null = null;
  try {
    const order = await prisma.chaplainProductOrder.findFirst({
      where: {
        id,
        checkoutToken: String(req.body.checkoutToken ?? ''),
        paymentMethod: ChaplainOrderPaymentMethod.ONLINE,
        paymentStatus: {
          in: [
            ChaplainOrderPaymentStatus.PENDING,
            ChaplainOrderPaymentStatus.FAILED,
          ],
        },
        status: ChaplainOrderStatus.PENDING,
      },
      include: {
        product: true,
        paymentTransactions: {
          where: { status: PaymentTransactionStatus.PENDING },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!order) {
      res.status(HTTPSTATUS.NOT_FOUND).json({
        code: 'NOT_FOUND',
        message: 'Eligible order checkout was not found',
      });
      return;
    }

    const existing = order.paymentTransactions[0];
    if (existing?.checkoutUrl) {
      res.status(HTTPSTATUS.OK).json({
        code: 'OK',
        message: 'Existing payment checkout retrieved',
        data: {
          reference: existing.reference,
          checkoutUrl: existing.checkoutUrl,
        },
      });
      return;
    }

    const gateway = order.paymentGateway as PaymentGateway;
    if (!Object.values(PaymentGateway).includes(gateway)) {
      res.status(HTTPSTATUS.BAD_REQUEST).json({
        code: 'INVALID_GATEWAY',
        message: 'Select Xendit or PayPal for this order',
      });
      return;
    }

    const reference = paymentReference();
    const transaction = await prisma.paymentTransaction.create({
      data: {
        reference,
        amount: order.total,
        currency: 'PHP',
        purpose: PaymentPurpose.CHAPLAIN_PRODUCT_ORDER,
        payerReference: order.customerUserId ?? order.customerEmail,
        gateway,
        chaplainProductOrderId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          productId: order.productId,
          customerEmail: order.customerEmail,
        },
      },
    });
    transactionId = transaction.id;

    const checkoutInput = {
      reference,
      amount: Number(order.total),
      currency: 'PHP',
      description: `${order.product.name} (${order.orderNumber})`,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
    };
    const checkout =
      gateway === PaymentGateway.XENDIT
        ? await createXenditCheckout(checkoutInput)
        : await createPayPalCheckout(checkoutInput);

    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          gatewayReference: checkout.gatewayReference,
          checkoutUrl: checkout.checkoutUrl,
          providerStatus: checkout.providerStatus,
          expiresAt: checkout.expiresAt,
        },
      }),
      prisma.chaplainProductOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: ChaplainOrderPaymentStatus.PENDING,
          providerCheckoutId: checkout.gatewayReference,
          providerCheckoutUrl: checkout.checkoutUrl,
        },
      }),
    ]);

    res.status(HTTPSTATUS.CREATED).json({
      code: 'CREATED',
      message: 'Payment checkout created successfully',
      data: { reference, checkoutUrl: checkout.checkoutUrl },
    });
  } catch (err) {
    if (transactionId) {
      await prisma.paymentTransaction
        .update({
          where: { id: transactionId },
          data: {
            status: PaymentTransactionStatus.FAILED,
            providerStatus: 'CHECKOUT_CREATION_FAILED',
            failureReason:
              err instanceof Error ? err.message : 'Unknown provider error',
          },
        })
        .catch(() => undefined);
    }
    logger.error('Error while initiating product payment', { err });
    res.status(HTTPSTATUS.BAD_GATEWAY).json({
      code: 'PAYMENT_GATEWAY_ERROR',
      message:
        err instanceof Error ? err.message : 'Payment gateway unavailable',
    });
  }
};

export const receiveXenditWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (
      !safeEqual(
        String(req.headers['x-callback-token'] ?? ''),
        config.XENDIT_WEBHOOK_TOKEN,
      )
    ) {
      res
        .status(HTTPSTATUS.UNAUTHORIZED)
        .json({ code: 'UNAUTHORIZED', message: 'Invalid webhook token' });
      return;
    }
    const event = String(req.body.event ?? '');
    const data = (req.body.data ?? {}) as Record<string, unknown>;
    const gatewayReference = String(data.payment_session_id ?? data.id ?? '');
    if (!gatewayReference) {
      res
        .status(HTTPSTATUS.BAD_REQUEST)
        .json({ code: 'BAD_REQUEST', message: 'Missing payment session ID' });
      return;
    }
    if (event === 'payment_session.completed') {
      await syncPaidTransaction(
        gatewayReference,
        String(data.status ?? 'COMPLETED'),
        data.amount === undefined ? undefined : Number(data.amount),
        data.currency === undefined ? undefined : String(data.currency),
      );
    } else if (event.includes('expired')) {
      await syncNonPaidTransaction(
        gatewayReference,
        PaymentTransactionStatus.EXPIRED,
        String(data.status ?? 'EXPIRED'),
      );
    } else if (event.includes('cancel')) {
      await syncNonPaidTransaction(
        gatewayReference,
        PaymentTransactionStatus.CANCELLED,
        String(data.status ?? 'CANCELLED'),
      );
    } else if (event.includes('fail')) {
      await syncNonPaidTransaction(
        gatewayReference,
        PaymentTransactionStatus.FAILED,
        String(data.status ?? 'FAILED'),
      );
    }
    res.status(HTTPSTATUS.OK).json({ received: true });
  } catch (err) {
    logger.error('Error while processing Xendit webhook', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Webhook processing failed',
    });
  }
};

export const receivePayPalWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!config.PAYPAL_WEBHOOK_ID)
      throw new Error('PAYPAL_WEBHOOK_ID is not configured');
    const accessToken = await getPayPalAccessToken();
    const verificationResponse = await fetch(
      `${config.PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: req.headers['paypal-auth-algo'],
          cert_url: req.headers['paypal-cert-url'],
          transmission_id: req.headers['paypal-transmission-id'],
          transmission_sig: req.headers['paypal-transmission-sig'],
          transmission_time: req.headers['paypal-transmission-time'],
          webhook_id: config.PAYPAL_WEBHOOK_ID,
          webhook_event: req.body,
        }),
      },
    );
    const verification = (await verificationResponse.json()) as {
      verification_status?: string;
    };
    if (
      !verificationResponse.ok ||
      verification.verification_status !== 'SUCCESS'
    ) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid PayPal webhook signature',
      });
      return;
    }

    const eventType = String(req.body.event_type ?? '');
    const resource = (req.body.resource ?? {}) as Record<string, unknown>;
    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = String(resource.id ?? '');
      const capture = await capturePayPalOrder(orderId);
      if (capture.status === 'COMPLETED')
        await syncPaidTransaction(orderId, capture.status);
    } else {
      const supplementary = resource.supplementary_data as
        | { related_ids?: { order_id?: string } }
        | undefined;
      const orderId =
        supplementary?.related_ids?.order_id ?? String(resource.id ?? '');
      if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        await syncPaidTransaction(orderId, 'COMPLETED');
      } else if (
        eventType === 'PAYMENT.CAPTURE.DENIED' ||
        eventType === 'CHECKOUT.ORDER.DECLINED'
      ) {
        await syncNonPaidTransaction(
          orderId,
          PaymentTransactionStatus.FAILED,
          eventType,
        );
      } else if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
        await syncNonPaidTransaction(
          orderId,
          PaymentTransactionStatus.REFUNDED,
          eventType,
        );
      }
    }
    res.status(HTTPSTATUS.OK).json({ received: true });
  } catch (err) {
    logger.error('Error while processing PayPal webhook', { err });
    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Webhook processing failed',
    });
  }
};
