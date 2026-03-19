import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { OwnerService } from './owner.service';
import { OwnerAuthGuard } from '../auth/owner-auth.guard';
import {
  IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsPositive, Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class SetupRestaurantDto {
  @IsString() name: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() imageUrl?: string;
  @IsArray() @IsString({ each: true }) cuisines: string[];
  @IsString() deliveryTime: string;
  @IsNumber() @IsOptional() @Min(0) deliveryFee?: number;
  @IsNumber() @IsOptional() @Min(0) minOrder?: number;
  @IsBoolean() @IsOptional() isOpen?: boolean;
}

class CreateMenuItemDto {
  @IsString() name: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsPositive() @Type(() => Number) price: number;
  @IsString() category: string;
  @IsBoolean() @IsOptional() isVeg?: boolean;
  @IsBoolean() @IsOptional() isPopular?: boolean;
  @IsBoolean() @IsOptional() isAvailable?: boolean;
  @Transform(({ value }) => (value === null || value === undefined || value === '') ? null : Number(value))
  @IsOptional() @IsNumber() @Min(0)
  stock?: number | null;
  @IsString() @IsOptional() imageUrl?: string;
}

class UpdateMenuItemDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsPositive() @IsOptional() @Type(() => Number) price?: number;
  @IsString() @IsOptional() category?: string;
  @IsBoolean() @IsOptional() isVeg?: boolean;
  @IsBoolean() @IsOptional() isPopular?: boolean;
  @IsBoolean() @IsOptional() isAvailable?: boolean;
  @Transform(({ value }) => (value === null || value === undefined || value === '') ? null : Number(value))
  @IsOptional() @IsNumber() @Min(0)
  stock?: number | null;
  @IsString() @IsOptional() imageUrl?: string;
}

class UpdateRestaurantDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() imageUrl?: string;
  @IsArray() @IsString({ each: true }) @IsOptional() cuisines?: string[];
  @IsString() @IsOptional() deliveryTime?: string;
  @IsNumber() @IsOptional() @Min(0) deliveryFee?: number;
  @IsNumber() @IsOptional() @Min(0) minOrder?: number;
  @IsBoolean() @IsOptional() isOpen?: boolean;
}

type OwnerRequest = { user: { userId: string } };

@UseGuards(OwnerAuthGuard)
@Controller('owner')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  // ── Restaurant setup ───────────────────────────────────────────────────────
  @Post('restaurant')
  setupRestaurant(@Req() req: OwnerRequest, @Body() dto: SetupRestaurantDto) {
    return this.ownerService.setupRestaurant(req.user.userId, dto);
  }

  @Get('restaurant')
  getMyRestaurant(@Req() req: OwnerRequest) {
    return this.ownerService.getMyRestaurant(req.user.userId);
  }

  @Patch('restaurant')
  updateRestaurant(@Req() req: OwnerRequest, @Body() dto: UpdateRestaurantDto) {
    return this.ownerService.updateRestaurant(req.user.userId, dto);
  }

  // ── Menu management ────────────────────────────────────────────────────────
  @Get('menu')
  getMenu(@Req() req: OwnerRequest) {
    return this.ownerService.getMenu(req.user.userId);
  }

  @Post('menu')
  createItem(@Req() req: OwnerRequest, @Body() dto: CreateMenuItemDto) {
    return this.ownerService.createMenuItem(req.user.userId, dto);
  }

  @Put('menu/:itemId')
  updateItem(
    @Req() req: OwnerRequest,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.ownerService.updateMenuItem(req.user.userId, itemId, dto);
  }

  @Delete('menu/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteItem(@Req() req: OwnerRequest, @Param('itemId') itemId: string) {
    return this.ownerService.deleteMenuItem(req.user.userId, itemId);
  }

  // ── Orders ─────────────────────────────────────────────────────────────────
  @Get('orders')
  getOrders(@Req() req: OwnerRequest) {
    return this.ownerService.getOrders(req.user.userId);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @Req() req: OwnerRequest,
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    return this.ownerService.updateOrderStatus(req.user.userId, orderId, body.status);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  @Get('stats')
  getStats(@Req() req: OwnerRequest) {
    return this.ownerService.getStats(req.user.userId);
  }
}
