import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, address: true, createdAt: true },
    });
  }

  updateAddress(userId: string, address: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { address },
      select: { id: true, address: true },
    });
  }
}
