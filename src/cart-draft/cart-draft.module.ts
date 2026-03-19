import { Module } from '@nestjs/common';
import { CartDraftService } from './cart-draft.service';
import { CartDraftController } from './cart-draft.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CartDraftService],
  controllers: [CartDraftController],
})
export class CartDraftModule {}
