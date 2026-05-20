import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma, UserRole, ShopStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, userRole: UserRole, dto: CreateShopDto) {
    if (userRole !== UserRole.SELLER) {
      throw new ForbiddenException('Only sellers can create a shop');
    }

    const existing = await this.prisma.shop.findUnique({ where: { ownerId: userId } });
    if (existing) throw new ConflictException('You already have a shop');

    return this.prisma.shop.create({
      data: { ...dto, ownerId: userId },
      include: { owner: true },
    });
  }

  async findAll(query: { district?: string; search?: string; page?: number; limit?: number } = {}) {
    const { district, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ShopWhereInput = { status: ShopStatus.APPROVED };
    if (district) where.district = district;
    if (search) where.name = { contains: search, mode: Prisma.QueryMode.insensitive };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.shop.findMany({
        where,
        include: { owner: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shop.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        products: { where: { status: ProductStatus.AVAILABLE } },
      },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async findMyShop(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerId: userId },
      include: { products: true, rentals: true },
    });
    if (!shop) throw new NotFoundException('You do not have a shop yet');
    return shop;
  }

  async update(userId: string, dto: UpdateShopDto) {
    const shop = await this.prisma.shop.findUnique({ where: { ownerId: userId } });
    if (!shop) throw new NotFoundException('Shop not found');
    return this.prisma.shop.update({ where: { id: shop.id }, data: dto });
  }

  async remove(userId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { ownerId: userId } });
    if (!shop) throw new NotFoundException('Shop not found');
    return this.prisma.shop.delete({ where: { id: shop.id } });
  }
}
