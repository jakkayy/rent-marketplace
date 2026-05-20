import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ShopStatus, ProductStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { PrismaService } from '../database/prisma.service';

const mockShop = {
  id: 'shop-1',
  name: 'Test Shop',
  status: ShopStatus.PENDING,
  ownerId: 'seller-1',
  createdAt: new Date(),
};

const mockUser = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  password: 'hashed',
};

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;

  const mockPrisma = {
    shop: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
    user: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
    product: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
    rental: { findMany: jest.fn(), count: jest.fn() },
    contactEvent: { count: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(AdminService);
    prisma = module.get(PrismaService);
  });

  // ─── updateShopStatus ─────────────────────────────────────────────────────

  describe('updateShopStatus', () => {
    it('should approve shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.shop.update.mockResolvedValue({ ...mockShop, status: ShopStatus.APPROVED });

      const result = await service.updateShopStatus('shop-1', ShopStatus.APPROVED);
      expect(result.status).toBe(ShopStatus.APPROVED);
      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { id: 'shop-1' },
        data: { status: ShopStatus.APPROVED },
      });
    });

    it('should suspend shop', async () => {
      prisma.shop.findUnique.mockResolvedValue({ ...mockShop, status: ShopStatus.APPROVED });
      prisma.shop.update.mockResolvedValue({ ...mockShop, status: ShopStatus.SUSPENDED });

      const result = await service.updateShopStatus('shop-1', ShopStatus.SUSPENDED);
      expect(result.status).toBe(ShopStatus.SUSPENDED);
    });

    it('should throw NotFoundException when shop not found', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.updateShopStatus('no-shop', ShopStatus.APPROVED)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── listShops ────────────────────────────────────────────────────────────

  describe('listShops', () => {
    it('should return paginated shops', async () => {
      prisma.$transaction.mockResolvedValue([[mockShop], 1]);
      const result = await service.listShops({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status PENDING', async () => {
      prisma.$transaction.mockResolvedValue([[mockShop], 1]);
      const result = await service.listShops({ status: 'PENDING' });
      expect(result.data[0].status).toBe(ShopStatus.PENDING);
    });

    it('should throw BadRequestException for invalid status', async () => {
      await expect(service.listShops({ status: 'INVALID_STATUS' })).rejects.toThrow(BadRequestException);
    });
  });

  // ─── toggleUserActive ─────────────────────────────────────────────────────

  describe('toggleUserActive', () => {
    it('should deactivate user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      const result = await service.toggleUserActive('user-1', false);
      expect(result.isActive).toBe(false);
      expect(result).not.toHaveProperty('password');
    });

    it('should activate user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
      prisma.user.update.mockResolvedValue({ ...mockUser, isActive: true });

      const result = await service.toggleUserActive('user-1', true);
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.toggleUserActive('no-user', false)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateProductStatus ──────────────────────────────────────────────────

  describe('updateProductStatus', () => {
    const mockProduct = { id: 'product-1', status: ProductStatus.AVAILABLE };

    it('should archive product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, status: ProductStatus.ARCHIVED });

      const result = await service.updateProductStatus('product-1', ProductStatus.ARCHIVED);
      expect(result.status).toBe(ProductStatus.ARCHIVED);
    });

    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.updateProductStatus('no-product', ProductStatus.ARCHIVED)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── listUsers ────────────────────────────────────────────────────────────

  describe('listUsers', () => {
    it('should return paginated users without password', async () => {
      prisma.$transaction.mockResolvedValue([[mockUser], 1]);
      const result = await service.listUsers({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return correct totalPages', async () => {
      prisma.$transaction.mockResolvedValue([[], 25]);
      const result = await service.listUsers({ page: 1, limit: 10 });
      expect(result.totalPages).toBe(3);
    });
  });

  // ─── listProducts ─────────────────────────────────────────────────────────

  describe('listProducts', () => {
    const mockProduct = { id: 'product-1', name: 'Camera', status: 'AVAILABLE' };

    it('should return paginated products', async () => {
      prisma.$transaction.mockResolvedValue([[mockProduct], 1]);
      const result = await service.listProducts();
      expect(result.data).toHaveLength(1);
    });

    it('should filter by status', async () => {
      prisma.$transaction.mockResolvedValue([[mockProduct], 1]);
      const result = await service.listProducts({ status: 'AVAILABLE' });
      expect(result.data).toHaveLength(1);
    });

    it('should throw BadRequestException for invalid product status', async () => {
      await expect(service.listProducts({ status: 'INVALID' })).rejects.toThrow(BadRequestException);
    });
  });

  // ─── listRentals ──────────────────────────────────────────────────────────

  describe('listRentals', () => {
    const mockRental = { id: 'rental-1', status: 'PENDING' };

    it('should return paginated rentals', async () => {
      prisma.$transaction.mockResolvedValue([[mockRental], 1]);
      const result = await service.listRentals();
      expect(result.data).toHaveLength(1);
    });

    it('should filter by status CONFIRMED', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.listRentals({ status: 'CONFIRMED' });
      expect(result.total).toBe(0);
    });

    it('should throw BadRequestException for invalid rental status', async () => {
      await expect(service.listRentals({ status: 'INVALID' })).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getStats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return all stats', async () => {
      prisma.$transaction.mockResolvedValue([10, 5, 25, 8, 2, 50]);

      const result = await service.getStats();
      expect(result).toEqual({
        users: 10,
        shops: 5,
        products: 25,
        rentals: 8,
        pendingShops: 2,
        contactEvents: 50,
      });
    });
  });
});
