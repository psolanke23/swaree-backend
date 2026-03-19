import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

class UpdateLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  status?: OrderStatus;
}

@UseGuards(JwtAuthGuard)
@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  @Get(':orderId')
  getState(@Param('orderId') orderId: string) {
    return this.trackingService.getState(orderId);
  }

  @Patch(':orderId/location')
  async updateLocation(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    const updated = await this.trackingService.updateLocation(
      orderId,
      dto.latitude,
      dto.longitude,
      dto.status,
    );
    // Push real-time update to all clients watching this order
    this.trackingGateway.emitTrackingUpdate(orderId, updated);
    return updated;
  }
}
