import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckAvailabilityItemDto } from './dto/check-availability.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  findByRestaurant(restaurantId: string, category?: string) {
    return this.prisma.menuItem.findMany({
      where: {
        restaurantId,
        isAvailable: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
    });
  }

  getCategories(restaurantId: string) {
    return this.prisma.menuItem
      .findMany({
        where: { restaurantId, isAvailable: true },
        select: { category: true },
        distinct: ['category'],
      })
      .then((rows) => rows.map((r) => r.category));
  }

  async checkAvailability(
    restaurantId: string,
    items: CheckAvailabilityItemDto[],
  ): Promise<{ unavailable: { menuItemId: string; name: string; reason: string; availableStock?: number }[] }> {
    const ids = items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: ids }, restaurantId },
      select: { id: true, name: true, isAvailable: true, stock: true },
    });

    const unavailable: { menuItemId: string; name: string; reason: string; availableStock?: number }[] = [];

    for (const { menuItemId, quantity } of items) {
      const mi = menuItems.find((m) => m.id === menuItemId);
      if (!mi || !mi.isAvailable) {
        unavailable.push({ menuItemId, name: mi?.name ?? 'Unknown item', reason: 'unavailable' });
      } else if (mi.stock !== null && mi.stock < quantity) {
        unavailable.push({
          menuItemId,
          name: mi.name,
          reason: mi.stock === 0 ? 'out_of_stock' : 'insufficient_stock',
          availableStock: mi.stock,
        });
      }
    }

    return { unavailable };
  }
}
