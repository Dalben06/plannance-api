import { describe, expect, it } from "vitest";
import { HmacSessionTokenService } from "../src/infrastructure/auth/hmacSessionTokenService.js";
import { AuthenticationError } from "../src/domain/auth.js";
import type { AuthenticatedUser } from "../src/domain/auth.js";

const secret = "test-secret-key-for-unit-tests";

const sampleUser: AuthenticatedUser = {
  id: "user-id-123",
  email: "user@example.com",
  name: "Test User",
  picture: null,
  emailVerified: true,
};

describe("HmacSessionTokenService", () => {
  describe("create", () => {
    it("returns a token and the configured ttl as expiresIn", () => {
      const service = new HmacSessionTokenService(secret, 1800);
      const { token, expiresIn } = service.create(sampleUser);

      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
      expect(expiresIn).toBe(1800);
    });

    it("throws when secret is not configured", () => {
      const service = new HmacSessionTokenService(undefined);
      expect(() => service.create(sampleUser)).toThrow("AUTH_JWT_SECRET is not configured");
    });
  });

  describe("verify", () => {
    it("verifies a token produced by create and returns the correct payload", () => {
      const service = new HmacSessionTokenService(secret, 3600);
      const { token } = service.create(sampleUser);
      const payload = service.verify(token);

      expect(payload.sub).toBe(sampleUser.id);
      expect(payload.email).toBe(sampleUser.email);
      expect(payload.name).toBe(sampleUser.name);
      expect(payload.emailVerified).toBe(true);
    });

    it("throws AuthenticationError for a token with fewer than 3 parts", () => {
      const service = new HmacSessionTokenService(secret);
      expect(() => service.verify("only.two")).toThrow(AuthenticationError);
    });

    it("throws AuthenticationError for a tampered signature", () => {
      const service = new HmacSessionTokenService(secret);
      const { token } = service.create(sampleUser);
      const [header, payload] = token.split(".");
      expect(() => service.verify(`${header}.${payload}.tampered_signature`)).toThrow(AuthenticationError);
    });

    it("throws AuthenticationError for a token signed with a different secret", () => {
      const signer = new HmacSessionTokenService("original-secret", 3600);
      const verifier = new HmacSessionTokenService("different-secret", 3600);
      const { token } = signer.create(sampleUser);
      expect(() => verifier.verify(token)).toThrow(AuthenticationError);
    });

    it("throws AuthenticationError for an expired token", () => {
      const service = new HmacSessionTokenService(secret, -1);
      const { token } = service.create(sampleUser);
      expect(() => service.verify(token)).toThrow(AuthenticationError);
    });

    it("throws AuthenticationError for a tampered payload", () => {
      const service = new HmacSessionTokenService(secret, 3600);
      const { token } = service.create(sampleUser);
      const [header, , signature] = token.split(".");
      const fakePaylod = Buffer.from(JSON.stringify({ sub: "hacker", exp: 9999999999, iat: 0 })).toString("base64url");
      expect(() => service.verify(`${header}.${fakePaylod}.${signature}`)).toThrow(AuthenticationError);
    });
  });
});
