import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../database/prisma.service';
import { TokenBlacklistService } from './token-blacklist.service';
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: '$2b$12$hashedpassword',
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

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let prisma: any;
  let tokenBlacklist: any;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockPrisma = {
    passwordResetToken: {
      updateMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = { signAsync: jest.fn().mockResolvedValue('mock-token') };
  const mockConfigService = { get: jest.fn().mockReturnValue('test-secret') };
  const mockTokenBlacklist = { revoke: jest.fn(), isRevoked: jest.fn().mockReturnValue(false) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TokenBlacklistService, useValue: mockTokenBlacklist },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    prisma = module.get(PrismaService);
    tokenBlacklist = module.get(TokenBlacklistService);
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.BUYER,
    };

    it('should register user and return token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ ...mockUser, ...dto });

      const result = await service.register(dto);
      expect(result.accessToken).toBe('mock-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictException when email already registered', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should return user and token on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: mockUser.email, password: 'password123' });
      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException when email not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'no@example.com', password: '123' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login({ email: mockUser.email, password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should revoke token and return success message', () => {
      const result = service.logout('jti-123', Math.floor(Date.now() / 1000) + 3600);
      expect(tokenBlacklist.revoke).toHaveBeenCalledWith('jti-123', expect.any(Number));
      expect(result.message).toBe('Logged out successfully');
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should return generic message when email not found (prevent enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const result = await service.forgotPassword({ email: 'no@example.com' });
      expect(result.message).toContain('If that email exists');
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('should create reset token when user found', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({});

      const result = await service.forgotPassword({ email: mockUser.email });
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      expect(result.message).toContain('If that email exists');
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const validRecord = {
        id: 'token-1',
        userId: 'user-1',
        token: 'hashed',
        used: false,
        expiresAt: new Date(Date.now() + 3600_000),
      };
      prisma.passwordResetToken.findUnique.mockResolvedValue(validRecord);
      prisma.passwordResetToken.update.mockResolvedValue({});
      usersService.update.mockResolvedValue({});

      const result = await service.resetPassword({ token: 'plain-token', password: 'newpassword123' });
      expect(result.message).toBe('Password reset successfully');
      expect(usersService.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ password: expect.any(String) }));
    });

    it('should throw BadRequestException when token not found', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword({ token: 'bad-token', password: 'newpass123' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when token already used', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        used: true,
        expiresAt: new Date(Date.now() + 3600_000),
      });
      await expect(service.resetPassword({ token: 'used-token', password: 'newpass123' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when token is expired', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        used: false,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.resetPassword({ token: 'expired-token', password: 'newpass123' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
