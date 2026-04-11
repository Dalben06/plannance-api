import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { PrismaUserSettingsRepository } from "../../../src/infrastructure/repositories/prismaUserSettingsRepository.js";

const makePrismaRow = (overrides: Record<string, unknown> = {}) => ({
  id: BigInt(1),
  userId: "user-123",
  phoneNumber: "+1234567890",
  isDarkMode: true,
  notifyByEmail: false,
  notifyByMessage: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const p2025 = Object.assign(new Error("Record not found"), { code: "P2025" });

const buildMockPrisma = () =>
  ({
    userSettings: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  }) as unknown as PrismaClient;

describe("PrismaUserSettingsRepository", () => {
  describe("findByUserId", () => {
    it("returns mapped settings when found", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.userSettings.findUnique).mockResolvedValue(makePrismaRow());
      const repo = new PrismaUserSettingsRepository(prisma);

      const result = await repo.findByUserId("user-123");

      expect(result).toMatchObject({
        id: "1",
        userId: "user-123",
        phoneNumber: "+1234567890",
        isDarkMode: true,
        notifyByEmail: false,
        notifyByMessage: false,
      });
      expect(prisma.userSettings.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-123" },
      });
    });

    it("returns null when not found", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.userSettings.findUnique).mockResolvedValue(null);
      const repo = new PrismaUserSettingsRepository(prisma);

      const result = await repo.findByUserId("user-123");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates settings and returns mapped result", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.userSettings.create).mockResolvedValue(makePrismaRow());
      const repo = new PrismaUserSettingsRepository(prisma);

      const input = {
        userId: "user-123",
        phoneNumber: "+1234567890",
        isDarkMode: true,
        notifyByEmail: false,
        notifyByMessage: false,
      };
      const result = await repo.create(input);

      expect(result).toMatchObject({
        id: "1",
        userId: "user-123",
        phoneNumber: "+1234567890",
        isDarkMode: true,
        notifyByEmail: false,
        notifyByMessage: false,
      });
      expect(prisma.userSettings.create).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          phoneNumber: "+1234567890",
          isDarkMode: true,
          notifyByEmail: false,
          notifyByMessage: false,
        },
      });
    });
  });

  describe("update", () => {
    it("updates settings and returns mapped result", async () => {
      const updatedRow = makePrismaRow({ isDarkMode: false, notifyByEmail: true });
      const prisma = buildMockPrisma();
      vi.mocked(prisma.userSettings.update).mockResolvedValue(updatedRow);
      const repo = new PrismaUserSettingsRepository(prisma);

      const input = {
        phoneNumber: "+1234567890",
        isDarkMode: false,
        notifyByEmail: true,
        notifyByMessage: false,
      };
      const result = await repo.update("user-123", input);

      expect(result).toMatchObject({
        id: "1",
        userId: "user-123",
        phoneNumber: "+1234567890",
        isDarkMode: false,
        notifyByEmail: true,
        notifyByMessage: false,
      });
      expect(prisma.userSettings.update).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        data: {
          phoneNumber: "+1234567890",
          isDarkMode: false,
          notifyByEmail: true,
          notifyByMessage: false,
        },
      });
    });

    it("returns null when P2025 error is thrown (record not found)", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.userSettings.update).mockRejectedValue(p2025);
      const repo = new PrismaUserSettingsRepository(prisma);

      const result = await repo.update("user-123", {
        phoneNumber: "+1234567890",
        isDarkMode: false,
        notifyByEmail: false,
        notifyByMessage: false,
      });

      expect(result).toBeNull();
    });

    it("re-throws non-P2025 errors", async () => {
      const prisma = buildMockPrisma();
      const unexpectedError = new Error("Connection error");
      vi.mocked(prisma.userSettings.update).mockRejectedValue(unexpectedError);
      const repo = new PrismaUserSettingsRepository(prisma);

      await expect(
        repo.update("user-123", {
          phoneNumber: "+1234567890",
          isDarkMode: false,
          notifyByEmail: false,
          notifyByMessage: false,
        })
      ).rejects.toThrow("Connection error");
    });
  });
});
