import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SetAvailabilityDto } from './dto/availability.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private async getShopByOwner(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerId: userId },
    });
    if (!shop) {
      throw new ForbiddenException('You do not have a shop');
    }
    return shop;
  }

  private async verifyProductOwner(productId: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.shop.ownerId !== userId) {
      throw new ForbiddenException('You do not own this product');
    }
    return product;
  }

  async create(userId: string, dto: CreateProductDto) {
    const shop = await this.getShopByOwner(userId);
    const { status, ...rest } = dto;

    return this.prisma.product.create({
      data: {
        ...rest,
        shopId: shop.id,
        ...(status && { status: status as ProductStatus }),
      },
      include: { category: true, shop: true },
    });
  }

  async findAll(query?: { categoryId?: string; shopId?: string; search?: string }) {
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.AVAILABLE,
        ...(query?.categoryId && { categoryId: query.categoryId }),
        ...(query?.shopId && { shopId: query.shopId }),
        ...(query?.search && {
          name: { contains: query.search, mode: 'insensitive' as any },
        }),
      },
      include: {
        category: true,
        shop: { select: { id: true, name: true, logo: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            phone: true,
            lineId: true,
            qrCodeUrl: true,
          },
        },
        reviews: { include: { author: { select: { firstName: true, lastName: true, avatar: true } } } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getAvailability(productId: string, month?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const where: any = { productId };
    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      where.date = { gte: start, lt: end };
    }

    return this.prisma.availability.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async setAvailability(userId: string, productId: string, dto: SetAvailabilityDto[]) {
    await this.verifyProductOwner(productId, userId);

    const dates = dto.map((d) => new Date(d.date));

    await this.prisma.availability.deleteMany({
      where: {
        productId,
        date: { in: dates },
      },
    });

    return this.prisma.availability.createMany({
      data: dto.map((d) => ({
        productId,
        date: new Date(d.date),
        isBooked: d.isBooked ?? false,
      })),
      skipDuplicates: true,
    });
  }

  async update(userId: string, productId: string, dto: UpdateProductDto) {
    await this.verifyProductOwner(productId, userId);

    const { status, categoryId, ...rest } = dto;

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...rest,
        ...(categoryId && { categoryId }),
        ...(status && { status: status as ProductStatus }),
      },
      include: { category: true },
    });
  }

  async remove(userId: string, productId: string) {
    await this.verifyProductOwner(productId, userId);

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }
}
