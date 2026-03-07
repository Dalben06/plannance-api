import { describe, expect, it } from "vitest";
import { HmacPasswordHasher } from "../../../src/infrastructure/auth/hmacPasswordHasher.js";

const secret = "test-secret-key-for-unit-tests";

describe("HmacPasswordHasher", () => {
  describe("hash", () => {
    it("produces a consistent hash for the same input", () => {
      const hasher = new HmacPasswordHasher(secret);
      expect(hasher.hash("password123")).toBe(hasher.hash("password123"));
    });

    it("produces different hashes for different inputs", () => {
      const hasher = new HmacPasswordHasher(secret);
      expect(hasher.hash("password123")).not.toBe(hasher.hash("password456"));
    });

    it("produces different hashes for the same input with a different secret", () => {
      const hasher1 = new HmacPasswordHasher("secret-a");
      const hasher2 = new HmacPasswordHasher("secret-b");
      expect(hasher1.hash("password")).not.toBe(hasher2.hash("password"));
    });

    it("throws when secret is not configured", () => {
      const hasher = new HmacPasswordHasher(undefined);
      expect(() => hasher.hash("value")).toThrow("AUTH_JWT_SECRET is not configured");
    });
  });

  describe("verify", () => {
    it("returns true for a correct plaintext against its hash", () => {
      const hasher = new HmacPasswordHasher(secret);
      const hashed = hasher.hash("mypassword");
      expect(hasher.verify("mypassword", hashed)).toBe(true);
    });

    it("returns false for an incorrect plaintext", () => {
      const hasher = new HmacPasswordHasher(secret);
      const hashed = hasher.hash("mypassword");
      expect(hasher.verify("wrongpassword", hashed)).toBe(false);
    });

    it("returns false when the stored hash was made with a different secret", () => {
      const hasherA = new HmacPasswordHasher("secret-a");
      const hasherB = new HmacPasswordHasher("secret-b");
      const hashed = hasherA.hash("mypassword");
      expect(hasherB.verify("mypassword", hashed)).toBe(false);
    });

    it("returns false for a hash of different length (not timing-safe shortcut)", () => {
      const hasher = new HmacPasswordHasher(secret);
      expect(hasher.verify("password", "tooshort")).toBe(false);
    });
  });
});
