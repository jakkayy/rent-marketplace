import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../database/prisma.service';

const mockShop = { id: 'shop-1', ownerId: 'seller-1' };

const mockProduct = {
  id: 'product-1',
  name: 'Test Camera',
  description: 'A camera',
  images: [],
  pricePerDay: 500,
  deposit: 2000,
  brand: 'Sony',
  size: null,
  color: null,
  occasion: 'photography',
  tags: [],
  condition: 'good',
  status: ProductStatus.AVAILABLE,
  shopId: 'shop-1',
  categoryId: 'cat-1',
  shop: mockShop,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  const mockPrisma = {
    shop: { findUnique: jest.fn() },
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    availability: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    contactEvent: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ProductsService);
    prisma = module.get(PrismaService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      name: 'Test Camera',
      pricePerDay: 500,
      categoryId: 'cat-1',
    };

    it('should create product successfully', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create('seller-1', dto);
      expect(result.name).toBe('Test Camera');
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ shopId: 'shop-1' }) }),
      );
    });

    it('should throw ForbiddenException when seller has no shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.create('seller-1', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated products', async () => {
      prisma.$transaction.mockResolvedValue([[mockProduct], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by occasion', async () => {
      prisma.$transaction.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ occasion: 'photography' });
      const [[findManyCall]] = prisma.$transaction.mock.calls;
      expect(findManyCall).toBeDefined();
    });

    it('should filter by price range', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAll({ priceMin: 100, priceMax: 300 });
      expect(result.data).toHaveLength(0);
    });

    it('should sort by priceAsc', async () => {
      prisma.$transaction.mockResolvedValue([[mockProduct], 1]);
      const result = await service.findAll({ sort: 'priceAsc' });
      expect(result.data).toHaveLength(1);
    });

    it('should sort by priceDesc', async () => {
      prisma.$transaction.mockResolvedValue([[mockProduct], 1]);
      const result = await service.findAll({ sort: 'priceDesc' });
      expect(result.data).toHaveLength(1);
    });

    it('should sort by popular', async () => {
      prisma.$transaction.mockResolvedValue([[mockProduct], 1]);
      const result = await service.findAll({ sort: 'popular' });
      expect(result.data).toHaveLength(1);
    });

    it('should filter by search keyword', async () => {
      prisma.$transaction.mockResolvedValue([[mockProduct], 1]);
      const result = await service.findAll({ search: 'camera' });
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── getAvailability ──────────────────────────────────────────────────────

  describe('getAvailability', () => {
    it('should return availability for a product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.availability.findMany.mockResolvedValue([
        { date: new Date('2026-06-01'), isBooked: false },
        { date: new Date('2026-06-02'), isBooked: true },
      ]);

      const result = await service.getAvailability('product-1');
      expect(result).toHaveLength(2);
    });

    it('should filter by month when provided', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.availability.findMany.mockResolvedValue([]);

      await service.getAvailability('product-1', '2026-06');
      expect(prisma.availability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ date: expect.any(Object) }) }),
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.getAvailability('no-product')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── setAvailability ──────────────────────────────────────────────────────

  describe('setAvailability', () => {
    const dto = [{ date: '2026-06-01', isBooked: true }, { date: '2026-06-02', isBooked: false }];

    it('should set availability when owner', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.availability.deleteMany.mockResolvedValue({ count: 0 });
      prisma.availability.createMany.mockResolvedValue({ count: 2 });

      const result = await service.setAvailability('seller-1', 'product-1', dto);
      expect(prisma.availability.deleteMany).toHaveBeenCalled();
      expect(prisma.availability.createMany).toHaveBeenCalled();
      expect(result.count).toBe(2);
    });

    it('should throw ForbiddenException when not product owner', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      await expect(service.setAvailability('other-seller', 'product-1', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── trackContact ─────────────────────────────────────────────────────────

  describe('trackContact', () => {
    const mockProductWithShop = { shopId: 'shop-1', shop: { lineId: '@camerahub' } };

    it('should track contact and return lineId', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProductWithShop);
      prisma.contactEvent.create.mockResolvedValue({});

      const result = await service.trackContact('product-1', 'user-1', 'product_detail');
      expect(result.lineId).toBe('@camerahub');
    });

    it('should track contact without userId (guest)', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProductWithShop);
      prisma.contactEvent.create.mockResolvedValue({});

      const result = await service.trackContact('product-1', null);
      expect(result.lineId).toBe('@camerahub');
    });

    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.trackContact('no-product', null)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return product with shop and reviews', async () => {
      prisma.product.findUnique.mockResolvedValue({ ...mockProduct, reviews: [] });
      const result = await service.findOne('product-1');
      expect(result.id).toBe('product-1');
    });

    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne('not-exist')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update product when owner', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, name: 'Updated' });

      const result = await service.update('seller-1', 'product-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw ForbiddenException when not product owner', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      await expect(service.update('other-seller', 'product-1', {})).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.update('seller-1', 'not-exist', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete product when owner', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('seller-1', 'product-1');
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'product-1' } });
      expect(result.id).toBe('product-1');
    });

    it('should throw ForbiddenException when not product owner', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      await expect(service.remove('other-seller', 'product-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
