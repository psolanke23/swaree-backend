import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

export interface TrackingUpdate {
  orderId: string;
  status: OrderStatus;
  riderName?: string | null;
  riderPhone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  estimatedMinutes?: number;
}

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async getState(orderId: string): Promise<TrackingUpdate> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { tracking: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    return {
      orderId,
      status: order.status,
      riderName: order.tracking?.riderName,
      riderPhone: order.tracking?.riderPhone,
      latitude: order.tracking?.latitude,
      longitude: order.tracking?.longitude,
    };
  }

  async updateLocation(
    orderId: string,
    lat: number,
    lng: number,
    status?: OrderStatus,
  ) {
    const data: Record<string, unknown> = { latitude: lat, longitude: lng };
    if (status) data['status'] = status;

    await this.prisma.deliveryTracking.update({
      where: { orderId },
      data,
    });

    if (status) {
      await this.prisma.order.update({ where: { id: orderId }, data: { status } });
    }

    return this.getState(orderId);
  }
}
