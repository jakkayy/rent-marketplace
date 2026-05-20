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

type FindAllQuery = {
  categoryId?: string;
  shopId?: string;
  search?: string;
  brand?: string;
  size?: string;
  color?: string;
  occasion?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private async getShopByOwner(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerId: userId },
    });
    if (!shop) throw new ForbiddenException('You do not have a shop');
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

  async findAll(query: FindAllQuery = {}) {
    const { page = 1, limit = 20, sort, priceMin, priceMax, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      status: ProductStatus.AVAILABLE,
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.shopId && { shopId: filters.shopId }),
      ...(filters.brand && { brand: filters.brand }),
      ...(filters.size && { size: filters.size }),
      ...(filters.color && { color: filters.color }),
      ...(filters.occasion && { occasion: filters.occasion }),
      ...(filters.search && {
        name: { contains: filters.search, mode: 'insensitive' },
      }),
      ...((priceMin !== undefined || priceMax !== undefined) && {
        pricePerDay: {
          ...(priceMin !== undefined && { gte: priceMin }),
          ...(priceMax !== undefined && { lte: priceMax }),
        },
      }),
    };

    const orderBy = this.resolveSort(sort);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          shop: { select: { id: true, name: true, logo: true } },
          _count: { select: { reviews: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private resolveSort(sort?: string) {
    switch (sort) {
      case 'priceAsc':
        return { pricePerDay: 'asc' as const };
      case 'priceDesc':
        return { pricePerDay: 'desc' as const };
      case 'popular':
        return { reviews: { _count: 'desc' as const } };
      default:
        return { createdAt: 'desc' as const };
    }
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
            instagram: true,
            qrCodeUrl: true,
            district: true,
          },
        },
        reviews: {
          include: {
            author: { select: { firstName: true, lastName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
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
      where: { productId, date: { in: dates } },
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

    return this.prisma.product.delete({ where: { id: productId } });
  }
}
