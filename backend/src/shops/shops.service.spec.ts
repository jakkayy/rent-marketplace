import { Test } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ShopStatus, UserRole } from '@prisma/client';
import { ShopsService } from './shops.service';
import { PrismaService } from '../database/prisma.service';

const mockShop = {
  id: 'shop-1',
  name: 'Test Shop',
  description: 'A test shop',
  district: 'Siam',
  status: ShopStatus.APPROVED,
  ownerId: 'seller-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ShopsService', () => {
  let service: ShopsService;
  let prisma: any;

  const mockPrisma = {
    shop: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ShopsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ShopsService);
    prisma = module.get(PrismaService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { name: 'New Shop', lineId: '@newshop' };

    it('should create shop for SELLER', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      prisma.shop.create.mockResolvedValue({ ...mockShop, ...dto });

      const result = await service.create('seller-1', UserRole.SELLER, dto);
      expect(result.name).toBe('New Shop');
      expect(prisma.shop.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ownerId: 'seller-1' }) }),
      );
    });

    it('should throw ForbiddenException when role is BUYER', async () => {
      await expect(service.create('buyer-1', UserRole.BUYER, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when role is ADMIN', async () => {
      await expect(service.create('admin-1', UserRole.ADMIN, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when seller already has a shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      await expect(service.create('seller-1', UserRole.SELLER, dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return only APPROVED shops', async () => {
      prisma.$transaction.mockResolvedValue([[mockShop], 1]);
      const result = await service.findAll();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return paginated results', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAll({ page: 2, limit: 10 });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(0);
    });

    it('should filter by district', async () => {
      prisma.$transaction.mockResolvedValue([[mockShop], 1]);
      const result = await service.findAll({ district: 'Siam' });
      expect(result.data[0].district).toBe('Siam');
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return shop with available products', async () => {
      prisma.shop.findUnique.mockResolvedValue({ ...mockShop, products: [] });
      const result = await service.findOne('shop-1');
      expect(result.id).toBe('shop-1');
    });

    it('should throw NotFoundException when shop not found', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.findOne('no-shop')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findMyShop ───────────────────────────────────────────────────────────

  describe('findMyShop', () => {
    it('should return sellers shop with products and rentals', async () => {
      prisma.shop.findUnique.mockResolvedValue({ ...mockShop, products: [], rentals: [] });
      const result = await service.findMyShop('seller-1');
      expect(result.ownerId).toBe('seller-1');
    });

    it('should throw NotFoundException when seller has no shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.findMyShop('seller-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update shop info', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.shop.update.mockResolvedValue({ ...mockShop, name: 'Updated Shop' });

      const result = await service.update('seller-1', { name: 'Updated Shop' });
      expect(result.name).toBe('Updated Shop');
    });

    it('should throw NotFoundException when shop not found', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.update('seller-1', { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.shop.delete.mockResolvedValue(mockShop);

      await service.remove('seller-1');
      expect(prisma.shop.delete).toHaveBeenCalledWith({ where: { id: 'shop-1' } });
    });

    it('should throw NotFoundException when shop not found', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.remove('seller-1')).rejects.toThrow(NotFoundException);
    });
  });
});
