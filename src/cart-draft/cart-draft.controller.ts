import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartDraftService } from './cart-draft.service';
import { SaveDraftDto } from './dto/save-draft.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cart-draft')
export class CartDraftController {
  constructor(private readonly cartDraftService: CartDraftService) {}

  /** GET /cart-draft — returns the user's single active draft with restaurant + menu item details. */
  @Get()
  getActiveDraft(@Req() req: { user: { userId: string } }) {
    return this.cartDraftService.getActiveDraft(req.user.userId);
  }

  @Get(':restaurantId')
  getDraft(
    @Param('restaurantId') restaurantId: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.cartDraftService.getDraft(req.user.userId, restaurantId);
  }

  @Put(':restaurantId')
  saveDraft(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: SaveDraftDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.cartDraftService.saveDraft(req.user.userId, restaurantId, dto.items);
  }

  @Delete(':restaurantId')
  @HttpCode(HttpStatus.OK)
  clearDraft(
    @Param('restaurantId') restaurantId: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.cartDraftService.clearDraft(req.user.userId, restaurantId);
  }
}
