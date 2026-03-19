import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto } from './dto/create-order.dto';

const TAX_RATE = 0.05; // 5%

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trackingGateway: TrackingGateway,
    private readonly mailService: MailService,
  ) {}

  async create(userId: string | null, dto: CreateOrderDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId: dto.restaurantId, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items are unavailable');
    }

    const itemMap = new Map(menuItems.map((m) => [m.id, m]));

    let subtotal = 0;
    const orderItems = dto.items.map((i) => {
      const item = itemMap.get(i.menuItemId)!;
      const totalPrice = item.price * i.quantity;
      subtotal += totalPrice;
      return { menuItemId: i.menuItemId, quantity: i.quantity, unitPrice: item.price, totalPrice };
    });

    const deliveryFee = restaurant.deliveryFee;
    const taxes = Math.round((subtotal * TAX_RATE) * 100) / 100;
    const total = subtotal + deliveryFee + taxes;

    const order = await this.prisma.$transaction(async (tx) => {
      for (const i of dto.items) {
        const menuItem = itemMap.get(i.menuItemId)!;
        if (menuItem.stock !== null) {
          if (menuItem.stock < i.quantity) {
            throw new BadRequestException(`"${menuItem.name}" is out of stock`);
          }
          await tx.menuItem.update({
            where: { id: i.menuItemId },
            data: {
              stock: { decrement: i.quantity },
              ...(menuItem.stock !== null && menuItem.stock - i.quantity <= 0
                ? { isAvailable: false, stock: 0 }
                : {}),
            },
          });
        }
      }

      return tx.order.create({
        data: {
          ...(userId ? { userId } : {}),
          guestName:  dto.guestName  ?? null,
          guestEmail: dto.guestEmail ?? null,
          guestPhone: dto.guestPhone ?? null,
          restaurantId: dto.restaurantId,
          deliveryAddress: dto.deliveryAddress,
          notes: dto.notes,
          subtotal,
          deliveryFee,
          taxes,
          total,
          items: { create: orderItems },
          tracking: { create: {} },
        },
        include: {
          items: { include: { menuItem: true } },
          tracking: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      });
    });

    this.trackingGateway.emitNewOrder(dto.restaurantId, order);

    return order;
  }

  findAllForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { restaurant: true, items: { include: { menuItem: true } }, tracking: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { restaurant: true, items: { include: { menuItem: true } }, tracking: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Public summary — no auth required.
   * Returns only the fields needed for the tracking page.
   * Excludes all PII (user email, guest contact details).
   */
  async getPublicSummary(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        subtotal: true,
        deliveryFee: true,
        taxes: true,
        total: true,
        deliveryAddress: true,
        createdAt: true,
        restaurant: { select: { name: true, imageUrl: true } },
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            menuItem: { select: { name: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findOneGuest(id: string, guestEmail: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, guestEmail },
      include: { restaurant: true, items: { include: { menuItem: true } }, tracking: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /** Public lookup — verifies email matches the order (guest or registered user) */
  async lookupByEmailAndOrderId(orderId: string, email: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { guestEmail: email },
          { user: { email } },
        ],
      },
      select: { id: true, status: true, paymentStatus: true, createdAt: true },
    });
    if (!order) throw new NotFoundException('No order found with that email and order ID');
    return order;
  }
}
