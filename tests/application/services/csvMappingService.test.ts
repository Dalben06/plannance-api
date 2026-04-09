import { describe, it, expect, vi } from "vitest";
import { createCsvMappingService } from "../../../src/application/services/csvMappingService.js";
import type { CsvMappingRepository } from "../../../src/application/ports/csvMappingRepository.js";
import type { CsvMappingTemplate } from "../../../src/domain/csv.js";
import { HttpError } from "../../../src/presentation/middleware/errorHandler.js";

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
  findById: vi.fn(),
  findAllByUser: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
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

describe("CsvMappingService.getMappingById", () => {
  it("returns the template when it exists and belongs to the user", async () => {
    const repo = buildMockRepo();
    const template = makeTemplate();
    vi.mocked(repo.findById).mockResolvedValue(template);
    const service = createCsvMappingService(repo);

    const result = await service.getMappingById("tpl-1", "user-123");

    expect(result).toEqual(template);
    expect(repo.findById).toHaveBeenCalledWith("tpl-1");
  });

  it("throws HttpError(400) when the mapping is not found", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.findById).mockResolvedValue(null);
    const service = createCsvMappingService(repo);

    await expect(service.getMappingById("tpl-missing", "user-123")).rejects.toThrow(
      expect.objectContaining({ status: 400, message: "Mapping not found" })
    );
  });

  it("throws HttpError(400) when the mapping belongs to a different user", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.findById).mockResolvedValue(makeTemplate({ userId: "other-user" }));
    const service = createCsvMappingService(repo);

    await expect(service.getMappingById("tpl-1", "user-123")).rejects.toThrow(
      expect.objectContaining({ status: 400, message: "Mapping not found" })
    );
  });
});

describe("CsvMappingService.updateMapping", () => {
  it("returns the updated template on success", async () => {
    const repo = buildMockRepo();
    const updated = makeTemplate({ name: "updated-name" });
    vi.mocked(repo.update).mockResolvedValue(updated);
    const service = createCsvMappingService(repo);

    const result = await service.updateMapping("tpl-1", "user-123", {
      name: "updated-name",
      mappings: [{ from: "Date", to: "startAt" }],
    });

    expect(result).toEqual(updated);
    expect(repo.update).toHaveBeenCalledWith("tpl-1", "user-123", {
      name: "updated-name",
      mappings: [{ from: "Date", to: "startAt" }],
    });
  });

  it("throws HttpError(400) when the mapping is not found or belongs to another user", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.update).mockResolvedValue(null);
    const service = createCsvMappingService(repo);

    await expect(
      service.updateMapping("tpl-missing", "user-123", {
        name: "x",
        mappings: [{ from: "Date", to: "startAt" }],
      })
    ).rejects.toThrow(expect.objectContaining({ status: 400, message: "Mapping not found" }));
  });

  it("throws HttpError(400) when repo returns null due to userId mismatch", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.update).mockResolvedValue(null);
    const service = createCsvMappingService(repo);

    await expect(
      service.updateMapping("tpl-1", "wrong-user", {
        name: "x",
        mappings: [{ from: "Amount", to: "amount" }],
      })
    ).rejects.toThrow(expect.objectContaining({ status: 400 }));
    expect(repo.update).toHaveBeenCalledWith("tpl-1", "wrong-user", expect.any(Object));
  });

  it("propagates unexpected errors from the repository", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.update).mockRejectedValue(new Error("DB error"));
    const service = createCsvMappingService(repo);

    await expect(
      service.updateMapping("tpl-1", "user-123", {
        name: "x",
        mappings: [{ from: "Date", to: "startAt" }],
      })
    ).rejects.toThrow("DB error");
  });
});

describe("CsvMappingService — HttpError type guard", () => {
  it("getMappingById throws a proper HttpError instance", async () => {
    const repo = buildMockRepo();
    vi.mocked(repo.findById).mockResolvedValue(null);
    const service = createCsvMappingService(repo);

    try {
      await service.getMappingById("x", "user-123");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(400);
    }
  });
});
