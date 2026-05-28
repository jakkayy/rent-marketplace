import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: 'hashed',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.BUYER,
  phone: null,
  avatar: null,
  lineId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProduct = { id: 'product-1', name: 'Camera' };
const mockFavorite = {
  id: 'fav-1',
  userId: 'user-1',
  productId: 'product-1',
  createdAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: { findUnique: jest.fn() },
    favorite: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService);
  });

  // ─── findById / findByIdOrThrow ───────────────────────────────────────────

  describe('findByIdOrThrow', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findByIdOrThrow('user-1');
      expect(result.id).toBe('user-1');
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findByIdOrThrow('no-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── updateProfile ────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('should update profile and not return password', async () => {
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Updated',
      });
      const result = await service.updateProfile('user-1', {
        firstName: 'Updated',
      });
      expect(result.firstName).toBe('Updated');
      expect(result).not.toHaveProperty('password');
    });

    it('should update only provided fields', async () => {
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        phone: '099-999-9999',
      });
      const result = await service.updateProfile('user-1', {
        phone: '099-999-9999',
      });
      expect(result.phone).toBe('099-999-9999');
    });
  });

  // ─── getFavorites ─────────────────────────────────────────────────────────

  describe('getFavorites', () => {
    it('should return list of favorites', async () => {
      prisma.favorite.findMany.mockResolvedValue([
        { ...mockFavorite, product: mockProduct },
      ]);
      const result = await service.getFavorites('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].product.id).toBe('product-1');
    });

    it('should return empty list when no favorites', async () => {
      prisma.favorite.findMany.mockResolvedValue([]);
      const result = await service.getFavorites('user-1');
      expect(result).toHaveLength(0);
    });
  });

  // ─── addFavorite ──────────────────────────────────────────────────────────

  describe('addFavorite', () => {
    it('should add product to favorites', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.favorite.findUnique.mockResolvedValue(null);
      prisma.favorite.create.mockResolvedValue(mockFavorite);

      const result = await service.addFavorite('user-1', 'product-1');
      expect(result.productId).toBe('product-1');
    });

    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.addFavorite('user-1', 'no-product')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when already in favorites', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.favorite.findUnique.mockResolvedValue(mockFavorite);
      await expect(service.addFavorite('user-1', 'product-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── removeFavorite ───────────────────────────────────────────────────────

  describe('removeFavorite', () => {
    it('should remove product from favorites', async () => {
      prisma.favorite.findUnique.mockResolvedValue(mockFavorite);
      prisma.favorite.delete.mockResolvedValue(mockFavorite);

      const result = await service.removeFavorite('user-1', 'product-1');
      expect(result.id).toBe('fav-1');
      expect(prisma.favorite.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when favorite not found', async () => {
      prisma.favorite.findUnique.mockResolvedValue(null);
      await expect(
        service.removeFavorite('user-1', 'product-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
