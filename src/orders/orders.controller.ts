import {
  Controller, Get, Post, Param, Body, UseGuards, Req, Headers,
  BadRequestException, NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * POST /orders — open to both authenticated users and guests.
   *
   * Auth detection (no Passport guard needed):
   *   - If a valid "Authorization: Bearer <token>" header is present,
   *     we decode it with JwtService to get userId.
   *   - If missing or invalid, userId stays null → guest flow.
   */
  @Post()
  create(
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: CreateOrderDto,
  ) {
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = this.jwtService.verify<{ sub: string }>(token, {
          secret: process.env.JWT_SECRET ?? 'fallback_dev_secret',
        });
        userId = payload.sub ?? null;
      } catch {
        // Expired / tampered token — fall through to guest validation
      }
    }

    if (!userId) {
      // Guest order — require contact details
      if (!dto.guestEmail) throw new BadRequestException('guestEmail is required for guest orders');
      if (!dto.guestName)  throw new BadRequestException('guestName is required for guest orders');
      if (!dto.guestPhone) throw new BadRequestException('guestPhone is required for guest orders');
    }

    return this.ordersService.create(userId, dto);
  }

  /** POST /orders/lookup — public. Guest or logged-in user supplies email + orderId to verify ownership. */
  @Post('lookup')
  lookup(@Body() body: { email: string; orderId: string }) {
    if (!body.email || !body.orderId) {
      throw new BadRequestException('email and orderId are required');
    }
    return this.ordersService.lookupByEmailAndOrderId(body.orderId, body.email);
  }

  /** GET /orders — authenticated only, returns the logged-in user's orders */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: { user: { userId: string } }) {
    return this.ordersService.findAllForUser(req.user.userId);
  }

  /**
   * GET /orders/:id/summary — public, no auth required.
   * Returns non-PII order summary for the live tracking page.
   * The order CUID is effectively unguessable, so this is safe.
   */
  @Get(':id/summary')
  getPublicSummary(@Param('id') id: string) {
    return this.ordersService.getPublicSummary(id);
  }

  /** GET /orders/:id — authenticated; also allows guest lookup by orderId only */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(id, req.user.userId);
  }
}
