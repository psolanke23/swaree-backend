import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type RestaurantStatusValue = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── All restaurants with owner + order stats ──────────────────────────────
  async getAllRestaurants() {
    const restaurants = await this.prisma.restaurant.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        _count: { select: { orders: true, menuItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return restaurants.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      cuisines: r.cuisines,
      deliveryFee: r.deliveryFee,
      minOrder: r.minOrder,
      isOpen: r.isOpen,
      isPopular: r.isPopular,
      status: (r as any).status ?? 'PENDING',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      owner: r.owner,
      totalOrders: r._count.orders,
      totalMenuItems: r._count.menuItems,
    }));
  }

  // ── Update restaurant status ───────────────────────────────────────────────
  async setRestaurantStatus(restaurantId: string, status: RestaurantStatusValue) {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { status } as any,
      select: { id: true, name: true, status: true } as any,
    });
  }

  // ── All orders across the platform ────────────────────────────────────────
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        restaurant: { select: { name: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Platform-wide stats ───────────────────────────────────────────────────
  async getStats() {
    const [
      totalRestaurants,
      pendingRestaurants,
      approvedRestaurants,
      totalOrders,
      totalUsers,
      revenueResult,
    ] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { status: 'PENDING' } as any }),
      this.prisma.restaurant.count({ where: { status: 'APPROVED' } as any }),
      this.prisma.order.count(),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } as any }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID' } }),
    ]);

    return {
      totalRestaurants,
      pendingRestaurants,
      approvedRestaurants,
      totalOrders,
      totalUsers,
      totalRevenue: revenueResult._sum.total ?? 0,
    };
  }

  // ── All users ─────────────────────────────────────────────────────────────
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true, name: true, email: true, phone: true, role: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Orders for a single restaurant ────────────────────────────────────────
  async getOrdersByRestaurant(restaurantId: string) {
    return this.prisma.order.findMany({
      where: { restaurantId },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Per-restaurant analytics ──────────────────────────────────────────────
  async getRestaurantAnalytics() {
    const restaurants = await this.prisma.restaurant.findMany({
      include: {
        owner: { select: { name: true, email: true } },
        orders: {
          select: { status: true, paymentStatus: true, total: true, createdAt: true },
        },
        _count: { select: { menuItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return restaurants.map(r => {
      const orders = r.orders;
      const totalOrders    = orders.length;
      const delivered      = orders.filter(o => o.status === 'DELIVERED').length;
      const cancelled      = orders.filter(o => o.status === 'CANCELLED').length;
      const pending        = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
      const revenue        = orders
        .filter(o => o.paymentStatus === 'PAID')
        .reduce((s, o) => s + Number(o.total), 0);
      const avgOrderValue  = delivered > 0
        ? orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + Number(o.total), 0) / delivered
        : 0;
      const lastOrderAt    = orders.length
        ? orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : null;

      return {
        id:            r.id,
        name:          r.name,
        status:        (r as any).status ?? 'PENDING',
        ownerName:     r.owner?.name ?? '—',
        ownerEmail:    r.owner?.email ?? '—',
        cuisines:      r.cuisines,
        isOpen:        r.isOpen,
        menuItems:     r._count.menuItems,
        totalOrders,
        delivered,
        cancelled,
        pending,
        revenue:       Math.round(revenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        lastOrderAt,
        createdAt:     r.createdAt,
      };
    });
  }
}
