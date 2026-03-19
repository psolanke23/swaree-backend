import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartDraftItemDto } from './dto/save-draft.dto';

@Injectable()
export class CartDraftService {
  constructor(private readonly prisma: PrismaService) {}

  async saveDraft(userId: string, restaurantId: string, items: CartDraftItemDto[]) {
    return this.prisma.$transaction(async (tx) => {
      // A user should only ever have one active draft (the current restaurant).
      // Delete any drafts for other restaurants before saving.
      await tx.cartDraft.deleteMany({ where: { userId, NOT: { restaurantId } } });
      return tx.cartDraft.upsert({
        where: { userId_restaurantId: { userId, restaurantId } },
        create: { userId, restaurantId, items: items as any },
        update: { items: items as any },
      });
    });
  }

  async getDraft(userId: string, restaurantId: string) {
    return this.prisma.cartDraft.findUnique({
      where: { userId_restaurantId: { userId, restaurantId } },
    });
  }

  /** Returns the user's single active draft with full restaurant + menu item details. */
  async getActiveDraft(userId: string) {
    const draft = await this.prisma.cartDraft.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        restaurant: {
          include: { menuItems: true },
        },
      },
    });
    return draft ?? null;
  }

  async clearDraft(userId: string, restaurantId: string) {
    await this.prisma.cartDraft.deleteMany({ where: { userId, restaurantId } });
    return { cleared: true };
  }
}
