import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString } from 'class-validator';

class UpdateAddressDto {
  @IsString()
  address: string;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: { user: { userId: string } }) {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('address')
  updateAddress(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(req.user.userId, dto.address);
  }
}
