import { createHmac, timingSafeEqual } from "node:crypto";
import type { PasswordHasher } from "../../application/ports/passwordHasher.js";

export class HmacPasswordHasher implements PasswordHasher {
  constructor(private readonly secret?: string) {}

  hash(value: string): string {
    return createHmac("sha256", this.getSecret()).update(value).digest("base64url");
  }

  verify(plain: string, hashed: string): boolean {
    const hashedPlain = this.hash(plain);
    const a = Buffer.from(hashed);
    const b = Buffer.from(hashedPlain);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  private getSecret(): string {
    if (!this.secret) {
      throw new Error("AUTH_JWT_SECRET is not configured");
    }
    return this.secret;
  }
}
