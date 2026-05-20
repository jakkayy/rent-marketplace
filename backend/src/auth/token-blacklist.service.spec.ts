import { TokenBlacklistService } from './token-blacklist.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;

  beforeEach(() => {
    service = new TokenBlacklistService();
  });

  describe('revoke + isRevoked', () => {
    it('should return false for token that has not been revoked', () => {
      expect(service.isRevoked('jti-unknown')).toBe(false);
    });

    it('should return true for a revoked token', () => {
      const exp = Date.now() + 3600_000;
      service.revoke('jti-1', exp);
      expect(service.isRevoked('jti-1')).toBe(true);
    });

    it('should return false and remove entry for expired revoked token', () => {
      const expiredAt = Date.now() - 1000;
      service.revoke('jti-expired', expiredAt);
      expect(service.isRevoked('jti-expired')).toBe(false);
    });

    it('should handle multiple revoked tokens independently', () => {
      const exp = Date.now() + 3600_000;
      service.revoke('jti-a', exp);
      service.revoke('jti-b', exp);
      expect(service.isRevoked('jti-a')).toBe(true);
      expect(service.isRevoked('jti-b')).toBe(true);
      expect(service.isRevoked('jti-c')).toBe(false);
    });
  });
});
