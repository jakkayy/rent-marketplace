import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from './token-blacklist.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(TokenBlacklistService);
    // skip Redis connection in tests — service stays in fallback mode
  });

  describe('revoke + isRevoked', () => {
    it('should return false for token that has not been revoked', async () => {
      expect(await service.isRevoked('jti-unknown')).toBe(false);
    });

    it('should return true for a revoked token', async () => {
      const exp = Date.now() + 3600_000;
      await service.revoke('jti-1', exp);
      expect(await service.isRevoked('jti-1')).toBe(true);
    });

    it('should return false and remove entry for expired revoked token', async () => {
      const expiredAt = Date.now() - 1000;
      await service.revoke('jti-expired', expiredAt);
      expect(await service.isRevoked('jti-expired')).toBe(false);
    });

    it('should handle multiple revoked tokens independently', async () => {
      const exp = Date.now() + 3600_000;
      await service.revoke('jti-a', exp);
      await service.revoke('jti-b', exp);
      expect(await service.isRevoked('jti-a')).toBe(true);
      expect(await service.isRevoked('jti-b')).toBe(true);
      expect(await service.isRevoked('jti-c')).toBe(false);
    });
  });
});
