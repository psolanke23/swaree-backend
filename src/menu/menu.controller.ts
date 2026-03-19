import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';

@Controller('restaurants/:restaurantId/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  findAll(
    @Param('restaurantId') restaurantId: string,
    @Query('category') category?: string,
  ) {
    return this.menuService.findByRestaurant(restaurantId, category);
  }

  @Get('categories')
  getCategories(@Param('restaurantId') restaurantId: string) {
    return this.menuService.getCategories(restaurantId);
  }

  @Post('check-availability')
  checkAvailability(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CheckAvailabilityDto,
  ) {
    return this.menuService.checkAvailability(restaurantId, dto.items);
  }
}
