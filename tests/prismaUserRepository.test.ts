import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { PrismaUserRepository } from "../src/infrastructure/repositories/prismaUserRepository.js";

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

  describe("findByEmail", () => {
    it("returns UserView with passwordHash when user is found", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(
        makePrismaUser({ password: "stored-bcrypt-hash" })
      );
      const repo = new PrismaUserRepository(prisma);

      const result = await repo.findByEmail("user@example.com");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("google-user-id");
      expect(result!.passwordHash).toBe("stored-bcrypt-hash");
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
      });
    });

    it("returns null when user does not exist", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      const repo = new PrismaUserRepository(prisma);

      const result = await repo.findByEmail("unknown@example.com");

      expect(result).toBeNull();
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
