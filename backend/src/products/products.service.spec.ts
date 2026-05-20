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
    availability: { findMany: jest.fn() },
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
