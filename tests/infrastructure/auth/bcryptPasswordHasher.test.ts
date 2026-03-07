import { describe, expect, it } from "vitest";
import { BcryptPasswordHasher } from "../../../src/infrastructure/auth/bcryptPasswordHasher.js";

describe("BcryptPasswordHasher", () => {
  describe("hash", () => {
    it("produces a verifiable hash for the same input", async () => {
      const hasher = new BcryptPasswordHasher();
      const hashed = await hasher.hash("password123");
      await expect(hasher.verify("password123", hashed)).resolves.toBe(true);
    });

    it("produces different hashes for the same input (random salt)", async () => {
      const hasher = new BcryptPasswordHasher();
      const hash1 = await hasher.hash("password123");
      const hash2 = await hasher.hash("password123");
      expect(hash1).not.toBe(hash2);
    });

    it("produces different hashes for different inputs", async () => {
      const hasher = new BcryptPasswordHasher();
      const hash2 = await hasher.hash("password456");
      await expect(hasher.verify("password123", hash2)).resolves.toBe(false);
    });
  });

  describe("verify", () => {
    it("returns true for correct plaintext against its hash", async () => {
      const hasher = new BcryptPasswordHasher();
      const hashed = await hasher.hash("mypassword");
      await expect(hasher.verify("mypassword", hashed)).resolves.toBe(true);
    });

    it("returns false for incorrect plaintext", async () => {
      const hasher = new BcryptPasswordHasher();
      const hashed = await hasher.hash("mypassword");
      await expect(hasher.verify("wrongpassword", hashed)).resolves.toBe(false);
    });
  });
});
