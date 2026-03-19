import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Razorpay = require('razorpay');

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly razorpay: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret) {
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.logger.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set — payments disabled');
    }
  }

  /**
   * Create a Razorpay order.
   * userId is null for guest orders — we look up only by orderId in that case.
   */
  async createRazorpayOrder(orderId: string, userId: string | null) {
    const order = await this.prisma.order.findFirst({
      where: userId ? { id: orderId, userId } : { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order already paid');
    }

    const rzpOrder = await this.razorpay.orders.create({
      amount: Math.round(order.total * 100), // paise
      currency: 'INR',
      receipt: order.id,
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  /** Client-side verify — called from frontend after Razorpay handler callback */
  async verifyPayment(
    orderId: string,
    userId: string | null,
    dto: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
  ) {
    const order = await this.prisma.order.findFirst({
      where: userId ? { id: orderId, userId } : { id: orderId },
      include: {
        restaurant: { select: { name: true } },
        user: { select: { name: true, email: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) {
      return { success: true }; // idempotent
    }

    // Verify signature: HMAC-SHA256 of "<razorpay_order_id>|<razorpay_payment_id>"
    const body = `${dto.razorpay_order_id}|${dto.razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '')
      .update(body)
      .digest('hex');

    if (expected !== dto.razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.ACCEPTED,
        razorpayPaymentId: dto.razorpay_payment_id,
      },
    });

    this.logger.log(`Order ${orderId} verified and marked PAID`);

    // Send order confirmation email after successful payment
    const email = order.user?.email ?? order.guestEmail;
    const name  = order.user?.name  ?? order.guestName ?? 'Customer';
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4100';
    if (email) {
      this.mailService.sendOrderConfirmation({
        to:             email,
        name,
        orderId:        order.id,
        restaurantName: order.restaurant.name,
        items:          order.items.map(i => ({
          name:     i.menuItem?.name ?? 'Item',
          quantity: i.quantity,
          price:    i.unitPrice,
        })),
        subtotal:        order.subtotal,
        deliveryFee:     order.deliveryFee,
        taxes:           order.taxes,
        total:           order.total,
        deliveryAddress: order.deliveryAddress,
        trackingUrl:     `${frontendUrl}/track/${order.id}`,
      });
    }

    return { success: true };
  }

  /** Webhook — called by Razorpay after payment */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

    // Validate HMAC-SHA256 signature (prevents forged webhooks)
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      this.logger.warn('Invalid Razorpay webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      payload: { payment: { entity: { order_id: string; id: string } } };
    };

    if (event.event === 'payment.captured') {
      const { order_id, id: paymentId } = event.payload.payment.entity;

      const order = await this.prisma.order.findFirst({
        where: { razorpayOrderId: order_id },
      });
      if (!order) return { received: true };

      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.ACCEPTED,
          razorpayPaymentId: paymentId,
        },
      });
      this.logger.log(`Order ${order.id} marked PAID`);
    }

    return { received: true };
  }

  /** Called by frontend when payment is dismissed or fails — sends failure email, order stays in draft */
  async reportPaymentFailed(orderId: string, userId: string | null) {
    const order = await this.prisma.order.findFirst({
      where: userId ? { id: orderId, userId } : { id: orderId },
      include: {
        restaurant: { select: { name: true } },
        user:       { select: { name: true, email: true } },
      },
    });
    if (!order) return; // silently ignore

    // Only send if payment is still not completed
    if (order.paymentStatus === 'PAID') return;

    const email = order.user?.email ?? order.guestEmail;
    const name  = order.user?.name  ?? order.guestName ?? 'Customer';
    if (email) {
      this.mailService.sendPaymentFailed({
        to:             email,
        name,
        orderId:        order.id,
        restaurantName: order.restaurant.name,
      });
    }
  }
}
