import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Headers,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class VerifyPaymentDto {
  @IsString() razorpay_payment_id!: string;
  @IsString() razorpay_order_id!: string;
  @IsString() razorpay_signature!: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments/orders/:orderId/initiate — public.
   * Works for both authenticated users (userId from JWT) and guests (userId = null).
   */
  @Post('orders/:orderId/initiate')
  initiatePayment(
    @Param('orderId') orderId: string,
    @Req() req: { user?: { userId: string } },
  ) {
    return this.paymentsService.createRazorpayOrder(orderId, req.user?.userId ?? null);
  }

  /**
   * POST /payments/orders/:orderId/verify — public.
   * Works for both authenticated users and guests.
   */
  @Post('orders/:orderId/verify')
  verifyPayment(
    @Param('orderId') orderId: string,
    @Body() dto: VerifyPaymentDto,
    @Req() req: { user?: { userId: string } },
  ) {
    return this.paymentsService.verifyPayment(orderId, req.user?.userId ?? null, dto);
  }

  /**
   * POST /payments/orders/:orderId/failed — public.
   * Called by the frontend when Razorpay payment fails or is cancelled.
   * Sends a failure email to the customer; order stays in draft (unpaid).
   */
  @Post('orders/:orderId/failed')
  @HttpCode(HttpStatus.OK)
  reportPaymentFailed(
    @Param('orderId') orderId: string,
    @Req() req: { user?: { userId: string } },
  ) {
    return this.paymentsService.reportPaymentFailed(orderId, req.user?.userId ?? null);
  }

  /** Public webhook endpoint (called by Razorpay) */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody!, signature);
  }
}
