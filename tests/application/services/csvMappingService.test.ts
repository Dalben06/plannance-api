import { describe, it, expect, vi } from "vitest";
import { createCsvMappingService } from "../../../src/application/services/csvMappingService.js";
import type { CsvMappingRepository } from "../../../src/application/ports/csvMappingRepository.js";
import type { CsvMappingTemplate } from "../../../src/domain/csv.js";

const makeTemplate = (overrides: Partial<CsvMappingTemplate> = {}): CsvMappingTemplate => ({
  id: "tpl-1",
  userId: "user-123",
  name: "bank-export",
  mappings: [{ from: "Date", to: "startAt" }],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const buildMockRepo = (): CsvMappingRepository => ({
  findAllByUser: vi.fn(),
  save: vi.fn(),
});

describe("createCsvMappingService", () => {
  it("listMappings delegates to repo.findAllByUser", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.findAllByUser).mockResolvedValue([makeTemplate()]);
    const service = createCsvMappingService(repo);

    const result = await service.listMappings("user-123");

    expect(result).toHaveLength(1);
    expect(repo.findAllByUser).toHaveBeenCalledWith("user-123");
  });

  it("saveMapping delegates to repo.save and returns the created template", async () => {
    const repo = buildMockRepo();
    const created = makeTemplate({ name: "payroll" });
    vi.mocked(repo.save).mockResolvedValue(created);
    const service = createCsvMappingService(repo);

    const result = await service.saveMapping("user-123", {
      name: "payroll",
      mappings: [{ from: "Date", to: "startAt" }],
    });

    expect(result).toEqual(created);
    expect(repo.save).toHaveBeenCalledWith("user-123", {
      name: "payroll",
      mappings: [{ from: "Date", to: "startAt" }],
    });
  });
});
