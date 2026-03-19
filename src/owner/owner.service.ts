import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { MailService } from '../mail/mail.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OwnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
    private readonly mailService: MailService,
  ) {}

  private async assertOwner(userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (!restaurant) throw new NotFoundException('No restaurant found for this owner. Please set up your restaurant first.');
    return restaurant;
  }

  // ── Restaurant setup ───────────────────────────────────────────────────────
  async setupRestaurant(userId: string, dto: {
    name: string; description?: string; imageUrl?: string;
    cuisines: string[]; deliveryTime: string; deliveryFee?: number; minOrder?: number;
  }) {
    const existing = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (existing) throw new ConflictException('You already have a restaurant registered.');

    return this.prisma.restaurant.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        cuisines: dto.cuisines,
        deliveryTime: dto.deliveryTime,
        deliveryFee: dto.deliveryFee ?? 30,
        minOrder: dto.minOrder ?? 100,
        ownerId: userId,
      },
    });
  }

  async getMyRestaurant(userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { ownerId: userId },
      include: { menuItems: { orderBy: { createdAt: 'asc' } } },
    });
    if (!restaurant) return null;
    // Return status so the owner portal can show approval state
    return { ...restaurant, status: (restaurant as any).status ?? 'PENDING' };
  }

  async updateRestaurant(userId: string, dto: Partial<{
    name: string; description: string; imageUrl: string;
    cuisines: string[]; deliveryTime: string; deliveryFee: number;
    minOrder: number; isOpen: boolean;
  }>) {
    const restaurant = await this.assertOwner(userId);
    return this.prisma.restaurant.update({
      where: { id: restaurant.id },
      data: dto,
    });
  }

  // ── Menu management ────────────────────────────────────────────────────────
  async getMenu(userId: string) {
    const restaurant = await this.assertOwner(userId);
    return this.prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createMenuItem(userId: string, dto: {
    name: string; description?: string; price: number; category: string;
    isVeg?: boolean; isPopular?: boolean; isAvailable?: boolean; stock?: number | null; imageUrl?: string;
  }) {
    const restaurant = await this.assertOwner(userId);
    return this.prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        category: dto.category,
        isVeg: dto.isVeg ?? true,
        isPopular: dto.isPopular ?? false,
        isAvailable: dto.isAvailable !== undefined ? dto.isAvailable : (dto.stock === 0 ? false : true),
        stock: dto.stock ?? null,
        imageUrl: dto.imageUrl,
      },
    });
  }

  async updateMenuItem(userId: string, itemId: string, dto: Partial<{
    name: string; description: string; price: number; category: string;
    isVeg: boolean; isPopular: boolean; isAvailable: boolean; stock: number | null; imageUrl: string;
  }>) {
    const restaurant = await this.assertOwner(userId);
    const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, restaurantId: restaurant.id } });
    if (!item) throw new ForbiddenException('Menu item not found or not yours');
    // Sync availability with stock when owner doesn't explicitly set isAvailable:
    //   stock null (unlimited) or stock > 0  →  available
    //   stock === 0              →  unavailable
    const autoAvailable =
      dto.stock !== undefined && dto.isAvailable === undefined
        ? { isAvailable: dto.stock === null || dto.stock > 0 }
        : {};
    return this.prisma.menuItem.update({ where: { id: itemId }, data: { ...dto, ...autoAvailable } });
  }

  async deleteMenuItem(userId: string, itemId: string) {
    const restaurant = await this.assertOwner(userId);
    const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, restaurantId: restaurant.id } });
    if (!item) throw new ForbiddenException('Menu item not found or not yours');
    await this.prisma.menuItem.delete({ where: { id: itemId } });
  }

  // ── Orders ─────────────────────────────────────────────────────────────────
  async getOrders(userId: string) {
    const restaurant = await this.assertOwner(userId);
    return this.prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { menuItem: { select: { name: true, price: true } } } },
        tracking: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(userId: string, orderId: string, status: string) {
    const restaurant = await this.assertOwner(userId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId: restaurant.id },
      include: {
        tracking: true,
        user: { select: { name: true, email: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    });
    if (!order) throw new ForbiddenException('Order not found or not yours');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: { tracking: true },
    });

    // Emit real-time status event to all watching clients
    const trackingPayload = {
      orderId,
      status: updated.status,
      riderName:  updated.tracking?.riderName  ?? null,
      riderPhone: updated.tracking?.riderPhone ?? null,
      latitude:   updated.tracking?.latitude   ?? null,
      longitude:  updated.tracking?.longitude  ?? null,
    };
    this.trackingGateway.emitOrderStatusUpdate(
      restaurant.id,
      orderId,
      updated.status,
      trackingPayload,
    );

    // Send status update email to the customer (registered or guest)
    const email = order.user?.email ?? order.guestEmail;
    const name  = order.user?.name  ?? order.guestName ?? 'Customer';
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4100';
    if (email) {
      this.mailService.sendStatusUpdate({
        to:             email,
        name,
        orderId:        order.id,
        restaurantName: restaurant.name,
        status:         status as OrderStatus,
        trackingUrl:    `${frontendUrl}/track/${order.id}`,
        items:          order.items.map(i => ({
          name:     i.menuItem.name,
          quantity: i.quantity,
          price:    Number(i.unitPrice),
        })),
        subtotal:    Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        taxes:       Number(order.taxes),
        total:       Number(order.total),
        deliveryAddress: order.deliveryAddress,
      });
    }

    return updated;
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  async getStats(userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (!restaurant) return { totalOrders: 0, totalRevenue: 0, totalItems: 0, pendingOrders: 0 };

    const [totalOrders, paidOrders, pendingOrders, totalItems] = await Promise.all([
      this.prisma.order.count({ where: { restaurantId: restaurant.id } }),
      this.prisma.order.aggregate({ where: { restaurantId: restaurant.id, paymentStatus: 'PAID' }, _sum: { total: true } }),
      this.prisma.order.count({ where: { restaurantId: restaurant.id, status: OrderStatus.PENDING } }),
      this.prisma.menuItem.count({ where: { restaurantId: restaurant.id } }),
    ]);

    return {
      totalOrders,
      totalRevenue: paidOrders._sum.total ?? 0,
      totalItems,
      pendingOrders,
    };
  }
}
