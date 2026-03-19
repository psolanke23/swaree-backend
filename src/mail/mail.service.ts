import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OrderStatus } from '@prisma/client';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:          'Order Placed',
  ACCEPTED:         'Order Accepted',
  PREPARING:        'Preparing Your Food',
  READY:            'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED:        'Delivered!',
  CANCELLED:        'Order Cancelled',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING:          '#f59e0b',
  ACCEPTED:         '#3b82f6',
  PREPARING:        '#8b5cf6',
  READY:            '#10b981',
  OUT_FOR_DELIVERY: '#f97316',
  DELIVERED:        '#22c55e',
  CANCELLED:        '#ef4444',
};

const STATUS_MESSAGE: Record<OrderStatus, string> = {
  PENDING:          'We have received your order and it is waiting for the restaurant to confirm.',
  ACCEPTED:         'Great news! The restaurant has accepted your order.',
  PREPARING:        'The restaurant is now preparing your delicious food.',
  READY:            'Your order is packed and ready — a delivery partner will pick it up shortly.',
  OUT_FOR_DELIVERY: 'Your order is on its way! The delivery partner is heading to your address.',
  DELIVERED:        'Your order has been delivered. Enjoy your meal!',
  CANCELLED:        'Unfortunately your order has been cancelled. If you were charged, a refund will be processed shortly.',
};

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly transporter: any;

  constructor() {
    // Uses SMTP env vars — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
    // For local testing use Mailtrap (https://mailtrap.io) or set SMTP_HOST=smtp.ethereal.email
    this.transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   ?? 'smtp.ethereal.email',
      port:   parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? '',
      },
    });
  }

  /** Called automatically by NestJS after DI — verifies SMTP connection */
  async onModuleInit() {
    const user = process.env.SMTP_USER;
    if (!user) {
      this.logger.warn('SMTP_USER not set — email sending is disabled');
      return;
    }
    this.logger.log(`SMTP configured: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} as ${user}`);
    try {
      await this.transporter.verify();
      this.logger.log('✅ SMTP connection verified — emails are ready to send');
    } catch (err: any) {
      this.logger.error(`❌ SMTP connection FAILED: ${err.message}`);
      this.logger.error('Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in your .env file');
    }
  }

  /** Send an order confirmation email right after order is placed */
  async sendOrderConfirmation(opts: {
    to: string;
    name: string;
    orderId: string;
    restaurantName: string;
    items: { name: string; quantity: number; price: number }[];
    subtotal: number;
    deliveryFee: number;
    taxes: number;
    total: number;
    deliveryAddress: string;
    trackingUrl?: string;
  }): Promise<void> {
    const trackingBtn = opts.trackingUrl
      ? `<div style="text-align:center;margin-bottom:24px">
          <a href="${opts.trackingUrl}" style="display:inline-block;background:#E23744;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">Track Your Order</a>
        </div>`
      : '';
    const itemRows = opts.items
      .map(
        (i) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${i.name}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right">₹${(i.quantity * i.price).toFixed(2)}</td>
          </tr>`,
      )
      .join('');

    const html = this.wrapEmail(`
      <h2 style="color:#E23744;margin:0 0 8px">Order Confirmed</h2>
      <p style="color:#555;margin:0 0 24px">Hi ${opts.name}, your order from <strong>${opts.restaurantName}</strong> has been placed successfully.</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr style="background:#f8f8f8">
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#777">Item</th>
            <th style="padding:8px 12px;text-align:center;font-size:13px;color:#777">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:13px;color:#777">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <table style="width:100%;margin-bottom:24px">
        <tr><td style="color:#555;padding:4px 0">Subtotal</td><td style="text-align:right;color:#555">₹${opts.subtotal.toFixed(2)}</td></tr>
        <tr><td style="color:#555;padding:4px 0">Delivery Fee</td><td style="text-align:right;color:#555">₹${opts.deliveryFee.toFixed(2)}</td></tr>
        <tr><td style="color:#555;padding:4px 0">Taxes (5%)</td><td style="text-align:right;color:#555">₹${opts.taxes.toFixed(2)}</td></tr>
        <tr style="border-top:2px solid #E23744">
          <td style="padding-top:8px;font-weight:bold">Total</td>
          <td style="text-align:right;font-weight:bold;color:#E23744;padding-top:8px">₹${opts.total.toFixed(2)}</td>
        </tr>
      </table>

      <div style="background:#f8f8f8;border-radius:8px;padding:12px 16px;margin-bottom:24px">
        <p style="margin:0;color:#555;font-size:13px"><strong>Delivery to:</strong> ${opts.deliveryAddress}</p>
      </div>

      ${trackingBtn}

      <p style="color:#888;font-size:12px;margin:0">Order ID: ${opts.orderId}</p>
      <p style="color:#888;font-size:12px">You will receive an email at every step of the way.</p>
    `);

    const itemLines = opts.items.map(i => `  - ${i.name} x${i.quantity}  Rs.${(i.quantity * i.price).toFixed(2)}`).join('\n');
    const text = [
      `Hi ${opts.name},`,
      ``,
      `Your order from ${opts.restaurantName} has been placed successfully.`,
      ``,
      `Items:`,
      itemLines,
      ``,
      `Subtotal:     Rs.${opts.subtotal.toFixed(2)}`,
      `Delivery Fee: Rs.${opts.deliveryFee.toFixed(2)}`,
      `Taxes (5%):   Rs.${opts.taxes.toFixed(2)}`,
      `Total:        Rs.${opts.total.toFixed(2)}`,
      ``,
      `Delivery to: ${opts.deliveryAddress}`,
      `Order ID: ${opts.orderId}`,
      opts.trackingUrl ? `Track your order: ${opts.trackingUrl}` : '',
      ``,
      `-- Sawree Team`,
    ].filter(Boolean).join('\n');

    await this.send(opts.to, `Order Confirmed - ${opts.restaurantName}`, html, text);
  }

  /** Send a status update email whenever the owner changes the order status */
  async sendStatusUpdate(opts: {
    to: string;
    name: string;
    orderId: string;
    restaurantName: string;
    status: OrderStatus;
    trackingUrl?: string;
    items?: { name: string; quantity: number; price: number }[];
    subtotal?: number;
    deliveryFee?: number;
    taxes?: number;
    total?: number;
    deliveryAddress?: string;
  }): Promise<void> {
    const label   = STATUS_LABEL[opts.status];
    const color   = STATUS_COLOR[opts.status];
    const message = STATUS_MESSAGE[opts.status];

    const trackingBtn = (opts.trackingUrl && opts.status !== 'CANCELLED' && opts.status !== 'DELIVERED')
      ? `<div style="text-align:center;margin-bottom:16px">
          <a href="${opts.trackingUrl}" style="display:inline-block;background:#E23744;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">Track Your Order</a>
        </div>`
      : '';

    const itemRows = opts.items?.length
      ? opts.items.map(i =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${i.name}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right">\u20b9${(i.quantity * i.price).toFixed(2)}</td>
          </tr>`,
        ).join('')
      : null;

    const itemsTable = itemRows
      ? `<table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr style="background:#f8f8f8">
              <th style="padding:8px 12px;text-align:left;font-size:13px;color:#777">Item</th>
              <th style="padding:8px 12px;text-align:center;font-size:13px;color:#777">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:13px;color:#777">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>`
      : '';

    const totalsTable = opts.total != null
      ? `<table style="width:100%;margin-bottom:24px">
          <tr><td style="color:#555;padding:4px 0">Subtotal</td><td style="text-align:right;color:#555">\u20b9${opts.subtotal!.toFixed(2)}</td></tr>
          <tr><td style="color:#555;padding:4px 0">Delivery Fee</td><td style="text-align:right;color:#555">\u20b9${opts.deliveryFee!.toFixed(2)}</td></tr>
          <tr><td style="color:#555;padding:4px 0">Taxes (5%)</td><td style="text-align:right;color:#555">\u20b9${opts.taxes!.toFixed(2)}</td></tr>
          <tr style="border-top:2px solid #E23744">
            <td style="padding-top:8px;font-weight:bold">Total</td>
            <td style="text-align:right;font-weight:bold;color:#E23744;padding-top:8px">\u20b9${opts.total.toFixed(2)}</td>
          </tr>
        </table>`
      : '';

    const addressBlock = opts.deliveryAddress
      ? `<div style="background:#f8f8f8;border-radius:8px;padding:12px 16px;margin-bottom:16px">
          <p style="margin:0;color:#555;font-size:13px"><strong>Delivery to:</strong> ${opts.deliveryAddress}</p>
        </div>`
      : '';

    const html = this.wrapEmail(`
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:${color};color:#fff;padding:10px 24px;border-radius:20px;font-weight:bold;font-size:16px">
          ${label}
        </div>
      </div>

      <p style="color:#333;margin:0 0 8px">Hi ${opts.name},</p>
      <p style="color:#555;margin:0 0 24px">${message}</p>

      <div style="background:#f8f8f8;border-radius:8px;padding:12px 16px;margin-bottom:16px">
        <p style="margin:0;color:#555;font-size:13px"><strong>Restaurant:</strong> ${opts.restaurantName}</p>
        <p style="margin:4px 0 0;color:#888;font-size:12px">Order ID: <code>${opts.orderId}</code></p>
      </div>

      ${itemsTable}
      ${totalsTable}
      ${addressBlock}

      ${
        opts.status === 'DELIVERED'
          ? '<p style="color:#22c55e;font-weight:bold;text-align:center">Thank you for ordering with Sawree!</p>'
          : ''
      }
      ${
        opts.status === 'CANCELLED'
          ? '<p style="color:#888;font-size:13px">Need help? Reply to this email or contact our support team.</p>'
          : ''
      }

      ${trackingBtn}
    `);

    const itemLines = opts.items?.map(i => `  - ${i.name} x${i.quantity}  Rs.${(i.quantity * i.price).toFixed(2)}`).join('\n') ?? '';
    const text = [
      `Hi ${opts.name},`,
      ``,
      `${label}`,
      ``,
      message,
      ``,
      `Restaurant: ${opts.restaurantName}`,
      `Order ID: ${opts.orderId}`,
      itemLines ? `\nItems:\n${itemLines}` : '',
      opts.total != null ? `\nSubtotal:     Rs.${opts.subtotal!.toFixed(2)}` : '',
      opts.total != null ? `Delivery Fee: Rs.${opts.deliveryFee!.toFixed(2)}` : '',
      opts.total != null ? `Taxes (5%):   Rs.${opts.taxes!.toFixed(2)}` : '',
      opts.total != null ? `Total:        Rs.${opts.total.toFixed(2)}` : '',
      opts.deliveryAddress ? `\nDelivery to: ${opts.deliveryAddress}` : '',
      opts.trackingUrl && opts.status !== 'CANCELLED' && opts.status !== 'DELIVERED' ? `\nTrack your order: ${opts.trackingUrl}` : '',
      ``,
      opts.status === 'CANCELLED' ? 'Need help? Contact our support team.' : '',
      ``,
      `-- Sawree Team`,
    ].filter(Boolean).join('\n');

    await this.send(opts.to, `Order Update: ${label} - ${opts.restaurantName}`, html, text);
  }

  /** Send a payment failed notification — order stays in draft, no charge */
  async sendPaymentFailed(opts: {
    to: string;
    name: string;
    orderId: string;
    restaurantName: string;
  }): Promise<void> {
    const html = this.wrapEmail(`
      <h2 style="color:#ef4444;margin:0 0 8px">Payment Failed</h2>
      <p style="color:#555;margin:0 0 24px">Hi ${opts.name}, we could not process your payment for the order from <strong>${opts.restaurantName}</strong>.</p>

      <div style="background:#fff3f3;border-left:4px solid #ef4444;border-radius:4px;padding:12px 16px;margin-bottom:24px">
        <p style="margin:0;color:#555;font-size:14px">Your order has been saved. No money has been deducted.</p>
      </div>

      <div style="background:#f8f8f8;border-radius:8px;padding:12px 16px;margin-bottom:24px">
        <p style="margin:0;color:#555;font-size:13px"><strong>Restaurant:</strong> ${opts.restaurantName}</p>
        <p style="margin:4px 0 0;color:#888;font-size:12px">Order ID: ${opts.orderId}</p>
      </div>

      <p style="color:#555;margin:0 0 8px">You can place a new order and try again.</p>
      <p style="color:#888;font-size:13px">If any amount was deducted, it will be automatically refunded within 5-7 business days.</p>
    `);

    const text = [
      `Hi ${opts.name},`,
      ``,
      `We could not process your payment for the order from ${opts.restaurantName}.`,
      ``,
      `Your order has been saved. No money has been deducted.`,
      `Order ID: ${opts.orderId}`,
      ``,
      `You can place a new order and try again.`,
      `If any amount was deducted, it will be refunded within 5-7 business days.`,
      ``,
      `-- Sawree Team`,
    ].join('\n');

    await this.send(opts.to, `Payment Failed - ${opts.restaurantName}`, html, text);
  }

  private async send(to: string, subject: string, html: string, text?: string): Promise<void> {
    if (!process.env.SMTP_USER) {
      this.logger.warn(`Email not configured — skipping email to ${to}: "${subject}"`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from:       process.env.SMTP_FROM ?? `"Sawree" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text:       text ?? html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim(),
        html,
        headers: {
          'X-Priority':        '3',
          'X-Mailer':          'Sawree Mailer',
          'X-Entity-Ref-ID':   `${Date.now()}`,
        },
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      // Never crash the request because email failed
      this.logger.error(`Failed to send email to ${to}: ${err}`);
    }
  }

  private wrapEmail(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%">
              <!-- Header -->
              <tr>
                <td style="background:#E23744;padding:24px 32px">
                  <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:-0.5px">Sawree</h1>
                  <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Food delivery, made simple</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:32px">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f8f8f8;padding:16px 32px;border-top:1px solid #eee;text-align:center">
                  <p style="margin:0;color:#aaa;font-size:12px">© ${new Date().getFullYear()} Sawree. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;
  }
}
