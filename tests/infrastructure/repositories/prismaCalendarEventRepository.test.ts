import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { PrismaCalendarEventRepository } from "../../../src/infrastructure/repositories/prismaCalendarEventRepository.js";

// Minimal Prisma row matching what mapRow expects
const makePrismaRow = (overrides: Record<string, unknown> = {}) => ({
  id: BigInt(1),
  userId: "user-123",
  title: "Salary",
  startAt: new Date("2026-03-05T12:00:00.000Z"),
  endAt: null,
  amount: 1500, // Number() converts fine
  type: "credit" as const,
  color: "#00C853",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const p2025 = Object.assign(new Error("Record not found"), { code: "P2025" });

const buildMockPrisma = () =>
  ({
    calendarEvent: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }) as unknown as PrismaClient;

describe("PrismaCalendarEventRepository", () => {
  describe("list", () => {
    it("returns mapped events from findMany", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([makePrismaRow()]);
      const repo = new PrismaCalendarEventRepository(prisma);

      const result = await repo.list({ weekStartsOn: 0 });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "1",
        userId: "user-123",
        title: "Salary",
        amount: 1500,
        type: "credit",
      });
    });

    it("filters by userId when provided", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([]);
      const repo = new PrismaCalendarEventRepository(prisma);

      await repo.list({ userId: "user-123", weekStartsOn: 0 });

      expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: "user-123" }) })
      );
    });

    it("adds startAt date range filter when month is provided", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([]);
      const repo = new PrismaCalendarEventRepository(prisma);

      await repo.list({ month: "2026-03", weekStartsOn: 0 });

      expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startAt: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        })
      );
    });

    it("does not add startAt filter for invalid month", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([]);
      const repo = new PrismaCalendarEventRepository(prisma);

      await repo.list({ month: "not-a-month", weekStartsOn: 0 });

      expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ startAt: expect.anything() }),
        })
      );
    });

    it("maps endAt and color to null when absent", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.findMany).mockResolvedValue([
        makePrismaRow({ endAt: null, color: null }),
      ]);
      const repo = new PrismaCalendarEventRepository(prisma);

      const [event] = await repo.list({ weekStartsOn: 0 });

      expect(event!.end).toBeNull();
      expect(event!.color).toBeNull();
    });
  });

  describe("getById", () => {
    it("returns mapped event when found", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.findUnique).mockResolvedValue(makePrismaRow());
      const repo = new PrismaCalendarEventRepository(prisma);

      const result = await repo.getById("1");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("1");
      expect(prisma.calendarEvent.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
    });

    it("returns null when not found", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.findUnique).mockResolvedValue(null);
      const repo = new PrismaCalendarEventRepository(prisma);

      const result = await repo.getById("999");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates event and returns mapped result", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.create).mockResolvedValue(makePrismaRow());
      const repo = new PrismaCalendarEventRepository(prisma);

      const result = await repo.create({
        userId: "user-123",
        title: "Salary",
        start: "2026-03-05T12:00:00.000Z",
        end: null,
        amount: 1500,
        type: "credit",
        color: "#00C853",
      });

      expect(result.id).toBe("1");
      expect(prisma.calendarEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-123",
            title: "Salary",
            amount: 1500,
            type: "credit",
          }),
        })
      );
    });

    it("sets endAt to null when end is not provided", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.create).mockResolvedValue(makePrismaRow());
      const repo = new PrismaCalendarEventRepository(prisma);

      await repo.create({
        userId: "user-123",
        title: "Salary",
        start: "2026-03-05T12:00:00.000Z",
        amount: 1500,
        type: "credit",
      });

      expect(prisma.calendarEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ endAt: null }) })
      );
    });
  });

  describe("update", () => {
    it("updates fields and returns mapped result", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.update).mockResolvedValue(makePrismaRow({ title: "Updated" }));
      const repo = new PrismaCalendarEventRepository(prisma);

      const result = await repo.update("1", { title: "Updated" });

      expect(result).not.toBeNull();
      expect(prisma.calendarEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(1) },
          data: expect.objectContaining({ title: "Updated" }),
        })
      );
    });

    it("calls getById and skips update when input is empty", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.findUnique).mockResolvedValue(makePrismaRow());
      const repo = new PrismaCalendarEventRepository(prisma);

      const result = await repo.update("1", {});

      expect(prisma.calendarEvent.update).not.toHaveBeenCalled();
      expect(prisma.calendarEvent.findUnique).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it("returns null on P2025 (record not found during update)", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.update).mockRejectedValue(p2025);
      const repo = new PrismaCalendarEventRepository(prisma);

      const result = await repo.update("999", { title: "X" });

      expect(result).toBeNull();
    });

    it("rethrows unknown errors during update", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.update).mockRejectedValue(new Error("DB connection lost"));
      const repo = new PrismaCalendarEventRepository(prisma);

      await expect(repo.update("1", { title: "X" })).rejects.toThrow("DB connection lost");
    });
  });

  describe("delete", () => {
    it("returns true when deletion succeeds", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.delete).mockResolvedValue(makePrismaRow());
      const repo = new PrismaCalendarEventRepository(prisma);

      const result = await repo.delete("1");

      expect(result).toBe(true);
      expect(prisma.calendarEvent.delete).toHaveBeenCalledWith({ where: { id: BigInt(1) } });
    });

    it("returns false on P2025 (record not found during delete)", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.delete).mockRejectedValue(p2025);
      const repo = new PrismaCalendarEventRepository(prisma);

      const result = await repo.delete("999");

      expect(result).toBe(false);
    });

    it("rethrows unknown errors during delete", async () => {
      const prisma = buildMockPrisma();
      vi.mocked(prisma.calendarEvent.delete).mockRejectedValue(new Error("Unexpected"));
      const repo = new PrismaCalendarEventRepository(prisma);

      await expect(repo.delete("1")).rejects.toThrow("Unexpected");
    });
  });
});
