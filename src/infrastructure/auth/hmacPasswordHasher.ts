import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { PasswordHasher } from "../../application/ports/passwordHasher.js";

export class HmacPasswordHasher implements PasswordHasher {
  constructor(private readonly secret: string | undefined) {}

  hash(value: string): string {
    if (!this.secret) throw new Error("AUTH_JWT_SECRET is not configured");

    const salt = randomBytes(16);
    const saltWithPepper = Buffer.concat([salt, Buffer.from(this.secret)]);
    const derivedKey = scryptSync(value, saltWithPepper, 32);
    const saltEncoded = salt.toString("base64url");
    const keyEncoded = derivedKey.toString("base64url");
    return `${saltEncoded}:${keyEncoded}`;
  }

  verify(plain: string, hashed: string): boolean {
    if (!this.secret) throw new Error("AUTH_JWT_SECRET is not configured");

    const [saltEncoded, keyEncoded] = hashed.split(":");

    if (!saltEncoded || !keyEncoded) return false;

    const salt = Buffer.from(saltEncoded, "base64url");
    const storedKey = Buffer.from(keyEncoded, "base64url");
    const saltWithPepper = Buffer.concat([salt, Buffer.from(this.secret)]);
    const derivedKey = scryptSync(plain, saltWithPepper, storedKey.length);

    if (storedKey.length !== derivedKey.length) return false;

    return timingSafeEqual(storedKey, derivedKey);
  }
}
