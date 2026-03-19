import {
  Controller, Get, Patch, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminService, RestaurantStatusValue } from './admin.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { IsIn } from 'class-validator';

class SetStatusDto {
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'])
  status: RestaurantStatusValue;
}

@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('restaurants')
  getAllRestaurants() {
    return this.adminService.getAllRestaurants();
  }

  @Patch('restaurants/:id/status')
  @HttpCode(HttpStatus.OK)
  setRestaurantStatus(@Param('id') id: string, @Body() dto: SetStatusDto) {
    return this.adminService.setRestaurantStatus(id, dto.status);
  }

  @Get('orders')
  getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('analytics')
  getRestaurantAnalytics() {
    return this.adminService.getRestaurantAnalytics();
  }

  @Get('restaurants/:id/orders')
  getRestaurantOrders(@Param('id') id: string) {
    return this.adminService.getOrdersByRestaurant(id);
  }
}
