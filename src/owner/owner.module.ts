import { Module } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TrackingModule } from '../tracking/tracking.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [AuthModule, PrismaModule, TrackingModule, MailModule],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
