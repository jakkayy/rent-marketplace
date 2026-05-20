import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RentalStatus } from '@prisma/client';
import { RentalsService } from './rentals.service';
import { PrismaService } from '../database/prisma.service';

const mockProduct = {
  id: 'product-1',
  shopId: 'shop-1',
  pricePerDay: 500,
  shop: { id: 'shop-1', ownerId: 'seller-1' },
};

const mockShop = { id: 'shop-1', ownerId: 'seller-1' };

const mockRental = {
  id: 'rental-1',
  renterId: 'buyer-1',
  shopId: 'shop-1',
  productId: 'product-1',
  startDate: new Date('2026-06-01'),
  endDate: new Date('2026-06-03'),
  totalDays: 3,
  totalPrice: 1500,
  status: RentalStatus.PENDING,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RentalsService', () => {
  let service: RentalsService;
  let prisma: any;

  const mockPrisma = {
    product: { findUnique: jest.fn() },
    availability: { findMany: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() },
    rental: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    shop: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RentalsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(RentalsService);
    prisma = module.get(PrismaService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { productId: 'product-1', startDate: '2026-06-01', endDate: '2026-06-03' };

    it('should create rental successfully', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.availability.findMany.mockResolvedValue([]);
      prisma.$transaction.mockImplementation(async (cb: any) =>
        cb({ rental: { create: jest.fn().mockResolvedValue(mockRental) }, availability: { createMany: jest.fn() } }),
      );

      const result = await service.create('buyer-1', dto);
      expect(result).toEqual(mockRental);
    });

    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.create('buyer-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when endDate <= startDate', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      await expect(
        service.create('buyer-1', { ...dto, startDate: '2026-06-03', endDate: '2026-06-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when startDate equals endDate', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      await expect(
        service.create('buyer-1', { ...dto, startDate: '2026-06-01', endDate: '2026-06-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when dates already booked', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.availability.findMany.mockResolvedValue([{ date: new Date('2026-06-01'), isBooked: true }]);
      await expect(service.create('buyer-1', dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── cancelRental ─────────────────────────────────────────────────────────

  describe('cancelRental', () => {
    it('should cancel rental and free availability', async () => {
      prisma.rental.findUnique.mockResolvedValue(mockRental);
      prisma.rental.update.mockResolvedValue({ ...mockRental, status: RentalStatus.CANCELLED });
      prisma.availability.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.cancelRental('buyer-1', 'rental-1');
      expect(result.status).toBe(RentalStatus.CANCELLED);
      expect(prisma.availability.deleteMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when rental not found', async () => {
      prisma.rental.findUnique.mockResolvedValue(null);
      await expect(service.cancelRental('buyer-1', 'rental-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not rental owner', async () => {
      prisma.rental.findUnique.mockResolvedValue(mockRental);
      await expect(service.cancelRental('other-user', 'rental-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when rental is COMPLETED', async () => {
      prisma.rental.findUnique.mockResolvedValue({ ...mockRental, status: RentalStatus.COMPLETED });
      await expect(service.cancelRental('buyer-1', 'rental-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when rental is ACTIVE', async () => {
      prisma.rental.findUnique.mockResolvedValue({ ...mockRental, status: RentalStatus.ACTIVE });
      await expect(service.cancelRental('buyer-1', 'rental-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should update PENDING → CONFIRMED', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.rental.findFirst.mockResolvedValue(mockRental);
      prisma.rental.update.mockResolvedValue({ ...mockRental, status: RentalStatus.CONFIRMED });

      const result = await service.updateStatus('seller-1', 'rental-1', { status: RentalStatus.CONFIRMED });
      expect(result.status).toBe(RentalStatus.CONFIRMED);
    });

    it('should update PENDING → REJECTED and free availability', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.rental.findFirst.mockResolvedValue(mockRental);
      prisma.rental.update.mockResolvedValue({ ...mockRental, status: RentalStatus.REJECTED });
      prisma.availability.deleteMany.mockResolvedValue({ count: 2 });

      await service.updateStatus('seller-1', 'rental-1', { status: RentalStatus.REJECTED });
      expect(prisma.availability.deleteMany).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user has no shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus('seller-1', 'rental-1', { status: RentalStatus.CONFIRMED }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when rental not found', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.rental.findFirst.mockResolvedValue(null);
      await expect(
        service.updateStatus('seller-1', 'rental-1', { status: RentalStatus.CONFIRMED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid transition PENDING → COMPLETED', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.rental.findFirst.mockResolvedValue(mockRental);
      await expect(
        service.updateStatus('seller-1', 'rental-1', { status: RentalStatus.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid transition CONFIRMED → REJECTED', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.rental.findFirst.mockResolvedValue({ ...mockRental, status: RentalStatus.CONFIRMED });
      await expect(
        service.updateStatus('seller-1', 'rental-1', { status: RentalStatus.REJECTED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update CONFIRMED → ACTIVE', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.rental.findFirst.mockResolvedValue({ ...mockRental, status: RentalStatus.CONFIRMED });
      prisma.rental.update.mockResolvedValue({ ...mockRental, status: RentalStatus.ACTIVE });

      const result = await service.updateStatus('seller-1', 'rental-1', { status: RentalStatus.ACTIVE });
      expect(result.status).toBe(RentalStatus.ACTIVE);
    });

    it('should update ACTIVE → COMPLETED', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.rental.findFirst.mockResolvedValue({ ...mockRental, status: RentalStatus.ACTIVE });
      prisma.rental.update.mockResolvedValue({ ...mockRental, status: RentalStatus.COMPLETED });

      const result = await service.updateStatus('seller-1', 'rental-1', { status: RentalStatus.COMPLETED });
      expect(result.status).toBe(RentalStatus.COMPLETED);
    });
  });

  // ─── findMyRentals ────────────────────────────────────────────────────────

  describe('findMyRentals', () => {
    it('should return paginated rentals for a buyer', async () => {
      prisma.$transaction.mockResolvedValue([[mockRental], 1]);

      const result = await service.findMyRentals('buyer-1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should return empty list when no rentals', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findMyRentals('buyer-1', { page: 1, limit: 10 });
      expect(result.data).toHaveLength(0);
      expect(result.totalPages).toBe(0);
    });
  });

  // ─── findShopRentals ──────────────────────────────────────────────────────

  describe('findShopRentals', () => {
    it('should return shop rentals', async () => {
      prisma.shop.findUnique.mockResolvedValue(mockShop);
      prisma.$transaction.mockResolvedValue([[mockRental], 1]);

      const result = await service.findShopRentals('seller-1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw ForbiddenException when user has no shop', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);
      await expect(service.findShopRentals('seller-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
