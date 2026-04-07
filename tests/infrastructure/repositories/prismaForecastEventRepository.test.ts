import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { PrismaForecastEventRepository } from "../../../src/infrastructure/repositories/prismaForecastEventRepository.js";

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: BigInt(1),
  uuid: "fc-uuid-1",
  userId: "user-123",
  name: "Rent",
  day: 5,
  amount: 1200,
  type: "debit" as const,
  startDate: new Date("2026-01-01T00:00:00.000Z"),
  endDate: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const buildMockPrisma = () =>
  ({
    forecastEvent: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  }) as unknown as PrismaClient;

describe("PrismaForecastEventRepository", () => {
  it("listByUser returns mapped rows", async () => {
    const prisma = buildMockPrisma();
    vi.mocked(prisma.forecastEvent.findMany).mockResolvedValue([makeRow()]);
    const repo = new PrismaForecastEventRepository(prisma);

    const result = await repo.listByUser("user-123");
    expect(prisma.forecastEvent.findMany).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      orderBy: { day: "asc" },
    });
    expect(result[0]).toMatchObject({
      id: "fc-uuid-1",
      userId: "user-123",
      name: "Rent",
      day: 5,
      amount: 1200,
      type: "debit",
      endDate: null,
    });
  });

  it("getByUuid scopes by user", async () => {
    const prisma = buildMockPrisma();
    vi.mocked(prisma.forecastEvent.findFirst).mockResolvedValue(makeRow());
    const repo = new PrismaForecastEventRepository(prisma);

    const result = await repo.getByUuid("fc-uuid-1", "user-123");
    expect(prisma.forecastEvent.findFirst).toHaveBeenCalledWith({
      where: { uuid: "fc-uuid-1", userId: "user-123" },
    });
    expect(result?.id).toBe("fc-uuid-1");
  });

  it("getByUuid returns null when not found", async () => {
    const prisma = buildMockPrisma();
    vi.mocked(prisma.forecastEvent.findFirst).mockResolvedValue(null);
    const repo = new PrismaForecastEventRepository(prisma);
    expect(await repo.getByUuid("missing", "user-123")).toBeNull();
  });

  it("create persists row", async () => {
    const prisma = buildMockPrisma();
    vi.mocked(prisma.forecastEvent.create).mockResolvedValue(makeRow());
    const repo = new PrismaForecastEventRepository(prisma);

    await repo.create({
      uuid: "fc-uuid-1",
      userId: "user-123",
      name: "Rent",
      day: 5,
      amount: 1200,
      type: "debit",
      startDate: "2026-01-01",
      endDate: null,
    });
    expect(prisma.forecastEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        uuid: "fc-uuid-1",
        userId: "user-123",
        name: "Rent",
        day: 5,
        amount: 1200,
        type: "debit",
        endDate: null,
      }),
    });
  });

  it("update returns null when no rows match", async () => {
    const prisma = buildMockPrisma();
    vi.mocked(prisma.forecastEvent.updateMany).mockResolvedValue({ count: 0 });
    const repo = new PrismaForecastEventRepository(prisma);
    const result = await repo.update("fc-uuid-1", "user-123", { name: "x" });
    expect(result).toBeNull();
  });

  it("update returns the updated row", async () => {
    const prisma = buildMockPrisma();
    vi.mocked(prisma.forecastEvent.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.forecastEvent.findFirst).mockResolvedValue(makeRow({ name: "Updated" }));
    const repo = new PrismaForecastEventRepository(prisma);

    const result = await repo.update("fc-uuid-1", "user-123", { name: "Updated" });
    expect(prisma.forecastEvent.updateMany).toHaveBeenCalledWith({
      where: { uuid: "fc-uuid-1", userId: "user-123" },
      data: { name: "Updated" },
    });
    expect(result?.name).toBe("Updated");
  });

  it("delete returns true when removed", async () => {
    const prisma = buildMockPrisma();
    vi.mocked(prisma.forecastEvent.deleteMany).mockResolvedValue({ count: 1 });
    const repo = new PrismaForecastEventRepository(prisma);
    expect(await repo.delete("fc-uuid-1", "user-123")).toBe(true);
  });

  it("delete returns false when nothing was removed", async () => {
    const prisma = buildMockPrisma();
    vi.mocked(prisma.forecastEvent.deleteMany).mockResolvedValue({ count: 0 });
    const repo = new PrismaForecastEventRepository(prisma);
    expect(await repo.delete("missing", "user-123")).toBe(false);
  });
});
