import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { SearchService, ProductDocument } from '../search/search.service';
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
  constructor(
    private prisma: PrismaService,
    private search: SearchService,
  ) {}

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

    const product = await this.prisma.product.create({
      data: {
        ...rest,
        shopId: shop.id,
        ...(status && { status: status as ProductStatus }),
      },
      include: { category: true, shop: true },
    });

    await this.search.upsert(this.toDocument(product));
    return product;
  }

  async findAll(query: FindAllQuery = {}) {
    const { page = 1, limit = 20, sort, priceMin, priceMax, ...filters } = query;
    const skip = (page - 1) * limit;

    // ── Meilisearch path (when available and search keyword is provided) ──
    if (this.search.isAvailable() && filters.search) {
      const meiliFilter: string[] = ['status = AVAILABLE'];
      if (filters.categoryId) meiliFilter.push(`categoryId = "${filters.categoryId}"`);
      if (filters.shopId) meiliFilter.push(`shopId = "${filters.shopId}"`);
      if (filters.occasion) meiliFilter.push(`occasion = "${filters.occasion}"`);
      if (filters.color) meiliFilter.push(`color = "${filters.color}"`);
      if (filters.size) meiliFilter.push(`size = "${filters.size}"`);
      if (priceMin !== undefined) meiliFilter.push(`pricePerDay >= ${priceMin}`);
      if (priceMax !== undefined) meiliFilter.push(`pricePerDay <= ${priceMax}`);

      const meiliSort = sort === 'priceAsc' ? ['pricePerDay:asc']
        : sort === 'priceDesc' ? ['pricePerDay:desc']
        : undefined;

      const { ids, total } = await this.search.search(filters.search, {
        filter: meiliFilter,
        sort: meiliSort,
        limit,
        offset: skip,
      });

      if (ids.length === 0) return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) };

      const data = await this.prisma.product.findMany({
        where: { id: { in: ids } },
        include: {
          category: true,
          shop: { select: { id: true, name: true, logo: true } },
          _count: { select: { reviews: true } },
        },
      });

      // preserve Meilisearch relevance order
      const ordered = ids.map((id: string) => data.find((p) => p.id === id)).filter(Boolean);
      return { data: ordered, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ── Database fallback path ──
    const where: Prisma.ProductWhereInput = { status: ProductStatus.AVAILABLE };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.shopId) where.shopId = filters.shopId;
    if (filters.brand) where.brand = filters.brand;
    if (filters.size) where.size = filters.size;
    if (filters.color) where.color = filters.color;
    if (filters.occasion) where.occasion = filters.occasion;
    if (filters.search) where.name = { contains: filters.search, mode: Prisma.QueryMode.insensitive };
    if (priceMin !== undefined || priceMax !== undefined) {
      where.pricePerDay = {
        ...(priceMin !== undefined && { gte: priceMin }),
        ...(priceMax !== undefined && { lte: priceMax }),
      };
    }

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

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...rest,
        ...(categoryId && { categoryId }),
        ...(status && { status: status as ProductStatus }),
      },
      include: { category: true, shop: true },
    });

    await this.search.upsert(this.toDocument(product));
    return product;
  }

  async remove(userId: string, productId: string) {
    await this.verifyProductOwner(productId, userId);

    const product = await this.prisma.product.delete({ where: { id: productId } });
    await this.search.delete(productId);
    return product;
  }

  private toDocument(product: any): ProductDocument {
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? null,
      brand: product.brand ?? null,
      occasion: product.occasion ?? null,
      color: product.color ?? null,
      size: product.size ?? null,
      tags: product.tags ?? [],
      pricePerDay: product.pricePerDay,
      categoryId: product.categoryId ?? null,
      shopId: product.shopId,
      shopName: product.shop?.name ?? '',
      status: product.status,
    };
  }

  async trackContact(productId: string, userId: string | null, source?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { shopId: true, shop: { select: { lineId: true } } },
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.contactEvent.create({
      data: {
        productId,
        shopId: product.shopId,
        source: source ?? 'product_detail',
        ...(userId && { userId }),
      },
    });

    return { lineId: product.shop.lineId };
  }
}
