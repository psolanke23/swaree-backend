import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(cuisine?: string) {
    return this.prisma.restaurant.findMany({
      where: {
        status: 'APPROVED' as any,
        isOpen: true,
        ...(cuisine ? { cuisines: { has: cuisine } } : {}),
      },
      orderBy: { rating: 'desc' },
    });
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }
}
