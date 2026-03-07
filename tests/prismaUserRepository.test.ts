import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { PrismaUserRepository } from "../src/infrastructure/repositories/prismaUserRepository.js";
import { AuthenticationError } from "../src/domain/auth.js";

const makePrismaUser = (overrides: Record<string, unknown> = {}) => ({
  id: BigInt(1),
  uuid: "google-user-id",
  email: "user@example.com",
  name: "Test User",
  picture: "https://example.com/pic.jpg",
  password: "hashed-password",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const buildMockPrisma = () =>
  ({
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  }) as unknown as PrismaClient;

describe("PrismaUserRepository", () => {
  describe("findById", () => {
    it("returns mapped UserView when user found", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(makePrismaUser());
      const repo = new PrismaUserRepository(prisma);

      const result = await repo.findById("google-user-id");

      expect(result).toEqual({
        id: "google-user-id",
        email: "user@example.com",
        name: "Test User",
        picture: "https://example.com/pic.jpg",
      });
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { uuid: "google-user-id" },
      });
    });

    it("returns null when user not found", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      const repo = new PrismaUserRepository(prisma);

      const result = await repo.findById("unknown-id");

      expect(result).toBeNull();
    });

    it("maps picture to null when absent", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(makePrismaUser({ picture: null }));
      const repo = new PrismaUserRepository(prisma);

      const result = await repo.findById("google-user-id");

      expect(result!.picture).toBeNull();
    });
  });

  describe("getByCredentials", () => {
    it("returns mapped UserView when credentials match", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(
        makePrismaUser({ password: "hashed-password" })
      );
      const repo = new PrismaUserRepository(prisma);

      const result = await repo.getByCredentials("user@example.com", "hashed-password");

      expect(result.id).toBe("google-user-id");
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
      });
    });

    it("throws AuthenticationError when user does not exist", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      const repo = new PrismaUserRepository(prisma);

      await expect(repo.getByCredentials("unknown@example.com", "any-hash")).rejects.toBeInstanceOf(
        AuthenticationError
      );
    });

    it("throws AuthenticationError when password does not match", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(
        makePrismaUser({ password: "correct-hash" })
      );
      const repo = new PrismaUserRepository(prisma);

      await expect(repo.getByCredentials("user@example.com", "wrong-hash")).rejects.toBeInstanceOf(
        AuthenticationError
      );
    });
  });

  describe("create", () => {
    it("creates user with provided id and returns mapped UserView", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.user.create).mockResolvedValue(makePrismaUser());
      const repo = new PrismaUserRepository(prisma);

      const result = await repo.create({
        id: "google-user-id",
        name: "Test User",
        email: "user@example.com",
        picture: "https://example.com/pic.jpg",
        password: "hashed-password",
      });

      expect(result.id).toBe("google-user-id");
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            uuid: "google-user-id",
            email: "user@example.com",
            name: "Test User",
            password: "hashed-password",
          }),
        })
      );
    });

    it("generates a UUID when no id is provided", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.user.create).mockResolvedValue(makePrismaUser({ uuid: "generated-uuid" }));
      const repo = new PrismaUserRepository(prisma);

      await repo.create({
        name: "Test User",
        email: "user@example.com",
        picture: null,
        password: "hashed-password",
      });

      const callArg = vi.mocked(prisma.user.create).mock.calls[0]![0]!;
      expect(callArg.data.uuid).toBeTruthy();
      expect(typeof callArg.data.uuid).toBe("string");
    });
  });
});
