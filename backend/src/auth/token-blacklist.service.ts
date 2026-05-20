import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  // jti → expiry timestamp (ms). In production, replace with Redis.
  private readonly blacklist = new Map<string, number>();

  revoke(jti: string, expiresAt: number) {
    this.blacklist.set(jti, expiresAt);
    this.cleanup();
  }

  isRevoked(jti: string): boolean {
    const exp = this.blacklist.get(jti);
    if (exp === undefined) return false;
    if (Date.now() > exp) {
      this.blacklist.delete(jti);
      return false;
    }
    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [jti, exp] of this.blacklist) {
      if (now > exp) this.blacklist.delete(jti);
    }
  }
}
