import { describe, expect, it, vi } from "vitest";
import { createForecastEventService } from "../../../src/application/services/forecastEventService.js";
import type { ForecastEventRepository } from "../../../src/application/ports/forecastEventRepository.js";
import type { ForecastEvent } from "../../../src/domain/forecastEvent.js";

const sample: ForecastEvent = {
  id: "fc-uuid-1",
  userId: "user-123",
  name: "Rent",
  day: 5,
  amount: 1200,
  type: "debit",
  startDate: "2026-01-01T00:00:00.000Z",
  endDate: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const buildRepo = (): ForecastEventRepository => ({
  listByUser: vi.fn(),
  getByUuid: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("forecastEventService", () => {
  it("creates a forecast with a generated uuid", async () => {
    const repo = buildRepo();
    (repo.create as ReturnType<typeof vi.fn>).mockResolvedValue(sample);
    const service = createForecastEventService(repo, () => "fc-uuid-1");

    const result = await service.createForecast("user-123", {
      name: "Rent",
      day: 5,
      amount: 1200,
      type: "debit",
      startDate: "2026-01-01",
    });

    expect(repo.create).toHaveBeenCalledWith({
      userId: "user-123",
      uuid: "fc-uuid-1",
      name: "Rent",
      day: 5,
      amount: 1200,
      type: "debit",
      startDate: "2026-01-01",
      endDate: null,
    });
    expect(result).toEqual(sample);
  });

  it("lists forecasts scoped by user", async () => {
    const repo = buildRepo();
    (repo.listByUser as ReturnType<typeof vi.fn>).mockResolvedValue([sample]);
    const service = createForecastEventService(repo, () => "x");

    const result = await service.listForecasts("user-123");
    expect(repo.listByUser).toHaveBeenCalledWith("user-123");
    expect(result).toHaveLength(1);
  });

  it("getForecastById passes uuid+userId", async () => {
    const repo = buildRepo();
    (repo.getByUuid as ReturnType<typeof vi.fn>).mockResolvedValue(sample);
    const service = createForecastEventService(repo, () => "x");

    await service.getForecastById("fc-uuid-1", "user-123");
    expect(repo.getByUuid).toHaveBeenCalledWith("fc-uuid-1", "user-123");
  });

  it("returns null when repo update returns null", async () => {
    const repo = buildRepo();
    (repo.update as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const service = createForecastEventService(repo, () => "x");

    const result = await service.updateForecast("missing", "user-123", { name: "x" });
    expect(result).toBeNull();
  });

  it("delete passes uuid+userId", async () => {
    const repo = buildRepo();
    (repo.delete as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const service = createForecastEventService(repo, () => "x");

    const result = await service.deleteForecast("fc-uuid-1", "user-123");
    expect(repo.delete).toHaveBeenCalledWith("fc-uuid-1", "user-123");
    expect(result).toBe(true);
  });
});
