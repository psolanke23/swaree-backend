import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OwnerAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context);
    if (!result) return false;
    const req = context.switchToHttp().getRequest();
    if (req.user?.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only restaurant owners can access this resource');
    }

    // Check restaurant approval status (skip for restaurant setup endpoint)
    const path: string = req.route?.path ?? '';
    if (!path.includes('restaurant') || req.method !== 'POST') {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { ownerId: req.user.userId },
        select: { status: true } as any,
      });
      if (restaurant) {
        const status = (restaurant as any).status ?? 'PENDING';
        if (status === 'REJECTED') {
          throw new ForbiddenException('Your restaurant application has been rejected.');
        }
        if (status === 'SUSPENDED') {
          throw new ForbiddenException('Your restaurant has been suspended. Please contact support.');
        }
        if (status === 'PENDING') {
          throw new ForbiddenException('APPROVAL_PENDING');
        }
      }
    }

    return true;
  }
}
