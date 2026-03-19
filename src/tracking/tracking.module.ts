import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { TrackingController } from './tracking.controller';

@Module({
  providers: [TrackingService, TrackingGateway],
  controllers: [TrackingController],
  exports: [TrackingGateway],
})
export class TrackingModule {}
