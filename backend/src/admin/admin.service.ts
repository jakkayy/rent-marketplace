import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, ShopStatus, ProductStatus, RentalStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Shops ───────────────────────────────────────────────────────────────

  async listShops(query: { status?: string; page?: number; limit?: number } = {}) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    if (status && !Object.values(ShopStatus).includes(status as ShopStatus)) {
      throw new BadRequestException(`Invalid shop status: ${status}`);
    }
    const where: Prisma.ShopWhereInput = {};
    if (status) where.status = status as ShopStatus;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.shop.findMany({
        where,
        include: { owner: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shop.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateShopStatus(shopId: string, status: ShopStatus) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    return this.prisma.shop.update({ where: { id: shopId }, data: { status } });
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  async listUsers(query: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, phone: true, isActive: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserActive(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...result } = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    return result;
  }

  // ─── Products ────────────────────────────────────────────────────────────

  async listProducts(query: { status?: string; page?: number; limit?: number } = {}) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    if (status && !Object.values(ProductStatus).includes(status as ProductStatus)) {
      throw new BadRequestException(`Invalid product status: ${status}`);
    }
    const where: Prisma.ProductWhereInput = {};
    if (status) where.status = status as ProductStatus;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          shop: { select: { id: true, name: true } },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateProductStatus(productId: string, status: ProductStatus) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.update({ where: { id: productId }, data: { status } });
  }

  // ─── Rentals ─────────────────────────────────────────────────────────────

  async listRentals(query: { status?: string; page?: number; limit?: number } = {}) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    if (status && !Object.values(RentalStatus).includes(status as RentalStatus)) {
      throw new BadRequestException(`Invalid rental status: ${status}`);
    }
    const where: Prisma.RentalWhereInput = {};
    if (status) where.status = status as RentalStatus;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.rental.findMany({
        where,
        include: {
          product: { select: { id: true, name: true } },
          shop: { select: { id: true, name: true } },
          renter: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rental.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Stats ───────────────────────────────────────────────────────────────

  async getStats() {
    const [users, shops, products, rentals, pendingShops, contactEvents] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.shop.count(),
        this.prisma.product.count(),
        this.prisma.rental.count(),
        this.prisma.shop.count({ where: { status: ShopStatus.PENDING } }),
        this.prisma.contactEvent.count(),
      ]);

    return { users, shops, products, rentals, pendingShops, contactEvents };
  }
}
