import { describe, expect, it, vi, beforeEach } from "vitest";
import { PrismaUserPlanRepository } from "../../../src/infrastructure/repositories/prismaUserPlanRepository.js";
import type { PrismaClient } from "@prisma/client";

const makeRow = (overrides = {}) => ({
  id: BigInt(1),
  userId: "user-123",
  budget: {
    valueOf: () => 1500,
    toString: () => "1500",
  } as unknown as import("@prisma/client").Prisma.Decimal,
  reminderImportRegister: true,
  notifyFixedEventOnDay: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const buildMockPrisma = () =>
  ({
    userPlan: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  }) as unknown as PrismaClient;

describe("PrismaUserPlanRepository", () => {
  describe("getByUserId", () => {
    it("returns mapped plan when found", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.userPlan.findFirst).mockResolvedValue(makeRow());
      const repo = new PrismaUserPlanRepository(prisma);

      const result = await repo.getByUserId("user-123");

      expect(result).toMatchObject({
        id: "1",
        userId: "user-123",
        budget: 1500,
        reminderImportRegister: true,
        notifyFixedEventOnDay: false,
      });
      expect(prisma.userPlan.findFirst).toHaveBeenCalledWith({ where: { userId: "user-123" } });
    });

    it("returns null when not found", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.userPlan.findFirst).mockResolvedValue(null);
      const repo = new PrismaUserPlanRepository(prisma);

      const result = await repo.getByUserId("user-123");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates and returns mapped plan", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.userPlan.create).mockResolvedValue(makeRow());
      const repo = new PrismaUserPlanRepository(prisma);

      const result = await repo.create({
        userId: "user-123",
        budget: 1500,
        reminderImportRegister: true,
        notifyFixedEventOnDay: false,
      });

      expect(result).toMatchObject({ id: "1", userId: "user-123", budget: 1500 });
      expect(prisma.userPlan.create).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          budget: 1500,
          reminderImportRegister: true,
          notifyFixedEventOnDay: false,
        },
      });
    });
  });

  describe("upsert", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("updates existing record when found by id and userId", async () => {
      const prisma = buildMockPrisma();
      const existingRow = makeRow();
      const updatedRow = makeRow({
        budget: {
          valueOf: () => 2000,
          toString: () => "2000",
        } as unknown as import("@prisma/client").Prisma.Decimal,
      });
      vi.mocked(prisma.userPlan.findFirst).mockResolvedValue(existingRow);
      vi.mocked(prisma.userPlan.update).mockResolvedValue(updatedRow);
      const repo = new PrismaUserPlanRepository(prisma);

      const result = await repo.upsert("1", "user-123", {
        budget: 2000,
        reminderImportRegister: true,
        notifyFixedEventOnDay: false,
      });

      expect(result.budget).toBe(2000);
      expect(prisma.userPlan.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { budget: 2000, reminderImportRegister: true, notifyFixedEventOnDay: false },
      });
      expect(prisma.userPlan.create).not.toHaveBeenCalled();
    });

    it("creates new record when not found by id and userId", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.userPlan.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.userPlan.create).mockResolvedValue(makeRow());
      const repo = new PrismaUserPlanRepository(prisma);

      const result = await repo.upsert("999", "user-123", {
        budget: 1500,
        reminderImportRegister: true,
        notifyFixedEventOnDay: false,
      });

      expect(result).toMatchObject({ userId: "user-123" });
      expect(prisma.userPlan.create).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          budget: 1500,
          reminderImportRegister: true,
          notifyFixedEventOnDay: false,
        },
      });
      expect(prisma.userPlan.update).not.toHaveBeenCalled();
    });
  });
});
