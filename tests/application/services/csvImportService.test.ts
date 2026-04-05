import { describe, it, expect, vi } from "vitest";
import { createCsvImportService } from "../../../src/application/services/csvImportService.js";
import type { CsvMappingService } from "../../../src/application/services/csvMappingService.js";
import type { CsvImportRepository } from "../../../src/application/ports/csvImportRepository.js";
import type { CalendarEventRepository } from "../../../src/application/ports/calendarEventRepository.js";
import type { CsvMappingTemplate } from "../../../src/domain/csv.js";
import type { CsvImportResult } from "../../../src/domain/csvImport.js";
import type { CalendarEvent } from "../../../src/domain/calendarEvent.js";
import { HttpError } from "../../../src/presentation/middleware/errorHandler.js";

const USER_ID = "user-123";
const TEMPLATE_ID = "tpl-1";

const makeTemplate = (overrides: Partial<CsvMappingTemplate> = {}): CsvMappingTemplate => ({
  id: TEMPLATE_ID,
  userId: USER_ID,
  name: "bank-export",
  mappings: [
    { from: "Date", to: "startAt" },
    { from: "Amount", to: "amount" },
    { from: "Description", to: "title" },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

type MockedService<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: T[K] extends (...args: any[]) => any ? ReturnType<typeof vi.fn<T[K]>> : T[K];
};

const buildMockMappingService = (): MockedService<CsvMappingService> => ({
  findById: vi.fn<CsvMappingService["findById"]>(),
  listMappings: vi.fn<CsvMappingService["listMappings"]>(),
  saveMapping: vi.fn<CsvMappingService["saveMapping"]>(),
});

const buildMockImportRepo = (): MockedService<CsvImportRepository> => ({
  findAllByUser: vi.fn<CsvImportRepository["findAllByUser"]>(),
  findById: vi.fn<CsvImportRepository["findById"]>(),
  save: vi
    .fn<CsvImportRepository["save"]>()
    .mockImplementation((result: CsvImportResult) => Promise.resolve(result)),
  update: vi
    .fn<CsvImportRepository["update"]>()
    .mockImplementation((result: CsvImportResult) => Promise.resolve(result)),
  delete: vi.fn<CsvImportRepository["delete"]>().mockResolvedValue(true),
});

const buildMockCalendarEventRepo = (): MockedService<CalendarEventRepository> => ({
  list: vi.fn<CalendarEventRepository["list"]>().mockResolvedValue([]),
  getById: vi.fn<CalendarEventRepository["getById"]>(),
  create: vi.fn<CalendarEventRepository["create"]>(),
  createMany: vi.fn<CalendarEventRepository["createMany"]>().mockResolvedValue([]),
  update: vi.fn<CalendarEventRepository["update"]>(),
  delete: vi.fn<CalendarEventRepository["delete"]>(),
});

const makeCsvBuffer = (rows: string[]): Buffer => Buffer.from(rows.join("\n"));

describe("CsvImportService", () => {
  it("throws 400 when template is not found", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(null);
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    await expect(service.importCsv(USER_ID, Buffer.from("a,b\n1,2"), TEMPLATE_ID)).rejects.toThrow(
      new HttpError("Invalid templateId", 400)
    );
  });

  it("throws 400 when template belongs to a different user", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate({ userId: "other-user" }));
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    await expect(service.importCsv(USER_ID, Buffer.from("a,b\n1,2"), TEMPLATE_ID)).rejects.toThrow(
      new HttpError("Invalid templateId", 400)
    );
  });

  it("throws 400 when CSV has no data rows (only header)", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    await expect(
      service.importCsv(USER_ID, makeCsvBuffer(["Date,Amount,Description"]), TEMPLATE_ID)
    ).rejects.toThrow(new HttpError("File needs at least one register", 400));
  });

  it("throws 400 when CSV is corrupted", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const corruptedBuffer = Buffer.from('"unclosed quote');

    await expect(service.importCsv(USER_ID, corruptedBuffer, TEMPLATE_ID)).rejects.toThrow(
      new HttpError("Invalid or corrupted CSV file", 400)
    );
  });

  it("maps valid rows into data array with correct fields", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer(["Date,Amount,Description", "2026-03-15,100.50,Salary"]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data).toHaveLength(1);
    expect(result.errorsLines).toHaveLength(0);
    expect(result.data[0]).toMatchObject({
      title: "Salary",
      start: "2026-03-15",
      amount: 100.5,
      type: "debit",
    });
    expect(result.data[0]!.id).toBeDefined();
  });

  it("derives type as debit when amount >= 0", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer([
      "Date,Amount,Description",
      "2026-03-15,0,Zero amount",
      "2026-03-15,50,Positive amount",
    ]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data[0]!.type).toBe("debit");
    expect(result.data[1]!.type).toBe("debit");
  });

  it("derives type as credit when amount < 0", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer(["Date,Amount,Description", "2026-03-15,-25.99,Grocery"]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data[0]!.type).toBe("credit");
  });

  it("maps startAt column to start field in output", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer(["Date,Amount,Description", "2026-06-01,10,Test"]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data[0]!.start).toBe("2026-06-01");
    expect((result.data[0] as Record<string, unknown>).startAt).toBeUndefined();
  });

  it("assigns unique GUID id to each row", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer([
      "Date,Amount,Description",
      "2026-03-15,10,Row1",
      "2026-03-16,20,Row2",
    ]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data[0]!.id).not.toBe(result.data[1]!.id);
    expect(result.id).toBeDefined();
  });

  it("separates rows with invalid date into errorsLines", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer(["Date,Amount,Description", "not-a-date,10,Test"]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data).toHaveLength(0);
    expect(result.errorsLines).toHaveLength(1);
    expect(result.errorsLines[0]!.line).toBe(1);
    expect(result.errorsLines[0]!.errors.length).toBeGreaterThan(0);
  });

  it("separates rows with missing title into errorsLines", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer(["Date,Amount,Description", "2026-03-15,10,"]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data).toHaveLength(0);
    expect(result.errorsLines).toHaveLength(1);
    expect(result.errorsLines[0]!.errors).toContain("Title is required");
  });

  it("separates rows with non-numeric amount into errorsLines", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer(["Date,Amount,Description", "2026-03-15,abc,Test"]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data).toHaveLength(0);
    expect(result.errorsLines).toHaveLength(1);
    expect(result.errorsLines[0]!.errors.length).toBeGreaterThan(0);
    expect(result.errorsLines[0]!.amount).toBe("abc");
    expect(result.errorsLines[0]!.type).toBeNull();
  });

  it("separates rows with blank amount into errorsLines", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer(["Date,Amount,Description", "2026-03-15,   ,Test"]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data).toHaveLength(0);
    expect(result.errorsLines).toHaveLength(1);
    expect(result.errorsLines[0]!.errors).toContain("Amount is required");
    expect(result.errorsLines[0]!.amount).toBe("   ");
    expect(result.errorsLines[0]!.type).toBeNull();
  });

  it("handles mixed valid and error rows", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer([
      "Date,Amount,Description",
      "2026-03-15,100,Salary",
      "invalid-date,abc,",
      "2026-03-16,-50,Grocery",
    ]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data).toHaveLength(2);
    expect(result.errorsLines).toHaveLength(1);
    expect(result.errorsLines[0]!.line).toBe(2);
  });

  it("correctly calculates line numbers for multiple error rows", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer([
      "Date,Amount,Description",
      "invalid-date,10,Test1", // line 1 (error: invalid date)
      "2026-03-15,abc,Test2", // line 2 (error: non-numeric amount)
      "2026-03-16,20,", // line 3 (error: missing title)
      "2026-03-17,30,Valid", // line 4 (valid)
      "not-a-date,xyz,", // line 5 (error: invalid date, non-numeric amount, missing title)
    ]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(result.data).toHaveLength(1);
    expect(result.errorsLines).toHaveLength(4);
    expect(result.errorsLines.map((e) => e.line)).toEqual([1, 2, 3, 5]);
    expect(result.errorsLines[0]!.errors.length).toBeGreaterThan(0);
    expect(result.errorsLines[1]!.errors.length).toBeGreaterThan(0);
    expect(result.errorsLines[2]!.errors.length).toBeGreaterThan(0);
    expect(result.errorsLines[3]!.errors.length).toBeGreaterThan(0);
  });

  it("calls repository save with correct structure", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer(["Date,Amount,Description", "2026-03-15,100,Salary"]);

    await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    expect(importRepo.save).toHaveBeenCalledOnce();
    const savedResult = importRepo.save.mock.calls[0]![0] as CsvImportResult;
    expect(savedResult.userId).toBe(USER_ID);
    expect(savedResult.id).toBeDefined();
    expect(savedResult.createdAt).toBeDefined();
    expect(savedResult.expiresAt).toBeDefined();
    expect(savedResult.data).toHaveLength(1);
    expect(savedResult.errorsLines).toHaveLength(0);
  });

  it("includes expiresAt approximately 3 hours in the future", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    mappingService.findById.mockResolvedValue(makeTemplate());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const csv = makeCsvBuffer(["Date,Amount,Description", "2026-03-15,100,Salary"]);

    const result = await service.importCsv(USER_ID, csv, TEMPLATE_ID);

    const created = new Date(result.createdAt).getTime();
    const expires = new Date(result.expiresAt).getTime();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    expect(expires - created).toBeGreaterThanOrEqual(threeHoursMs - 1000);
    expect(expires - created).toBeLessThanOrEqual(threeHoursMs + 1000);
  });
});

describe("CsvImportService.listPendingImports", () => {
  const makeResult = (id: string): CsvImportResult => ({
    id,
    userId: USER_ID,
    errorsLines: [],
    data: [{ id: "row-1", title: "Test", start: "2026-03-15", amount: 10, type: "debit" }],
    createdAt: "2026-04-04T00:00:00.000Z",
    expiresAt: "2026-04-04T03:00:00.000Z",
  });

  it("returns pending imports for the user", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const results = [makeResult("imp-1"), makeResult("imp-2")];
    importRepo.findAllByUser.mockResolvedValue(results);
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const imports = await service.listPendingImports(USER_ID);

    expect(imports).toEqual(results);
    expect(importRepo.findAllByUser).toHaveBeenCalledWith(USER_ID);
  });

  it("throws 404 when no pending imports exist", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    importRepo.findAllByUser.mockResolvedValue([]);
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    await expect(service.listPendingImports(USER_ID)).rejects.toThrow(
      new HttpError("No pending imports found", 404)
    );
  });
});

describe("CsvImportService.updateImport", () => {
  const makeExistingImport = (): CsvImportResult => ({
    id: "import-1",
    userId: USER_ID,
    errorsLines: [
      {
        id: "err-1",
        line: 1,
        title: "",
        start: "2026-03-15",
        amount: 10,
        type: "debit",
        errors: ["Title is required"],
      },
    ],
    data: [{ id: "row-1", title: "Salary", start: "2026-03-15", amount: 100, type: "debit" }],
    createdAt: "2026-04-04T00:00:00.000Z",
    expiresAt: "2026-04-04T03:00:00.000Z",
  });

  it("throws 404 when import is not found", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    importRepo.findById.mockResolvedValue(null);
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    await expect(
      service.updateImport(USER_ID, { id: "non-existent", data: [], errorsLines: [] })
    ).rejects.toThrow(new HttpError("Import not found", 404));
  });

  it("throws 404 when import belongs to a different user", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    importRepo.findById.mockResolvedValue(makeExistingImport());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    await expect(
      service.updateImport("other-user", { id: "import-1", data: [], errorsLines: [] })
    ).rejects.toThrow(new HttpError("Import not found", 404));
  });

  it("throws 400 when updated data contains an invalid date", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    importRepo.findById.mockResolvedValue(makeExistingImport());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    await expect(
      service.updateImport(USER_ID, {
        id: "import-1",
        data: [
          {
            id: "row-1",
            title: "Salary",
            start: "not-a-date",
            amount: 100,
            type: "debit",
          },
        ],
        errorsLines: [],
      })
    ).rejects.toThrow(new HttpError("Validation error", 400));

    expect(importRepo.update).not.toHaveBeenCalled();
  });

  it("calls repo.update with merged result preserving metadata", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const existing = makeExistingImport();
    importRepo.findById.mockResolvedValue(existing);
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const updatedData = [
      { id: "row-1", title: "Salary", start: "2026-03-15", amount: 100, type: "debit" as const },
      {
        id: "row-2",
        title: "Fixed Row",
        start: "2026-03-15",
        amount: 10,
        type: "debit" as const,
      },
    ];

    await service.updateImport(USER_ID, {
      id: "import-1",
      data: updatedData,
      errorsLines: [],
    });

    expect(importRepo.update).toHaveBeenCalledOnce();
    const saved = importRepo.update.mock.calls[0]![0] as CsvImportResult;
    expect(saved.id).toBe(existing.id);
    expect(saved.userId).toBe(existing.userId);
    expect(saved.createdAt).toBe(existing.createdAt);
    expect(saved.expiresAt).toBe(existing.expiresAt);
    expect(saved.data).toEqual(updatedData);
    expect(saved.errorsLines).toEqual([]);
  });

  it("normalizes row type from the amount sign before saving", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    importRepo.findById.mockResolvedValue(makeExistingImport());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    await service.updateImport(USER_ID, {
      id: "import-1",
      data: [
        {
          id: "row-1",
          title: "Salary",
          start: "2026-03-15",
          amount: -100,
          type: "debit",
        },
      ],
      errorsLines: [],
    });

    expect(importRepo.update).toHaveBeenCalledOnce();
    const saved = importRepo.update.mock.calls[0]![0] as CsvImportResult;
    expect(saved.data).toEqual([
      {
        id: "row-1",
        title: "Salary",
        start: "2026-03-15",
        amount: -100,
        type: "credit",
      },
    ]);
  });

  it("returns the updated result", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    importRepo.findById.mockResolvedValue(makeExistingImport());
    const service = createCsvImportService(
      mappingService,
      importRepo,
      buildMockCalendarEventRepo()
    );

    const result = await service.updateImport(USER_ID, {
      id: "import-1",
      data: [{ id: "row-1", title: "Salary", start: "2026-03-15", amount: 100, type: "debit" }],
      errorsLines: [],
    });

    expect(result.id).toBe("import-1");
    expect(result.data).toHaveLength(1);
    expect(result.errorsLines).toHaveLength(0);
  });
});

describe("CsvImportService.confirmImport", () => {
  const makeImport = (overrides: Partial<CsvImportResult> = {}): CsvImportResult => ({
    id: "import-1",
    userId: USER_ID,
    errorsLines: [],
    data: [
      { id: "row-1", title: "Salary", start: "2026-03-15", amount: 100, type: "debit" },
      { id: "row-2", title: "Grocery", start: "2026-03-20", amount: -50, type: "credit" },
    ],
    createdAt: "2026-04-04T00:00:00.000Z",
    expiresAt: "2026-04-04T03:00:00.000Z",
    ...overrides,
  });

  const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
    id: "1",
    userId: USER_ID,
    title: "Salary",
    start: "2026-03-15T00:00:00.000Z",
    amount: 100,
    type: "debit",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  });

  it("throws 400 when import is not found", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const calendarEventRepo = buildMockCalendarEventRepo();
    importRepo.findById.mockResolvedValue(null);
    const service = createCsvImportService(mappingService, importRepo, calendarEventRepo);

    await expect(service.confirmImport(USER_ID, "non-existent")).rejects.toThrow(
      new HttpError("Import not found", 400)
    );
  });

  it("throws 400 when import belongs to a different user", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const calendarEventRepo = buildMockCalendarEventRepo();
    importRepo.findById.mockResolvedValue(makeImport({ userId: "other-user" }));
    const service = createCsvImportService(mappingService, importRepo, calendarEventRepo);

    await expect(service.confirmImport(USER_ID, "import-1")).rejects.toThrow(
      new HttpError("Import not found", 400)
    );
  });

  it("throws 400 when import has validation errors", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const calendarEventRepo = buildMockCalendarEventRepo();
    importRepo.findById.mockResolvedValue(
      makeImport({
        errorsLines: [
          {
            id: "err-1",
            line: 1,
            title: "",
            start: "2026-03-15",
            amount: 10,
            type: "debit",
            errors: ["Title is required"],
          },
        ],
      })
    );
    const service = createCsvImportService(mappingService, importRepo, calendarEventRepo);

    await expect(service.confirmImport(USER_ID, "import-1")).rejects.toThrow(
      new HttpError("Import still has validation errors", 400)
    );
  });

  it("deletes import and returns zeros when data is empty", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const calendarEventRepo = buildMockCalendarEventRepo();
    importRepo.findById.mockResolvedValue(makeImport({ data: [] }));
    const service = createCsvImportService(mappingService, importRepo, calendarEventRepo);

    const result = await service.confirmImport(USER_ID, "import-1");

    expect(result).toEqual({ inserted: 0, duplicates: 0, total: 0 });
    expect(importRepo.delete).toHaveBeenCalledWith("import-1");
    expect(calendarEventRepo.createMany).not.toHaveBeenCalled();
  });

  it("queries existing events with correct date range", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const calendarEventRepo = buildMockCalendarEventRepo();
    importRepo.findById.mockResolvedValue(makeImport());
    const service = createCsvImportService(mappingService, importRepo, calendarEventRepo);

    await service.confirmImport(USER_ID, "import-1");

    expect(calendarEventRepo.list).toHaveBeenCalledWith({
      userId: USER_ID,
      dateRange: { start: "2026-03-15", end: "2026-03-20" },
    });
  });

  it("deduplicates rows matching existing events by title, date, and amount", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const calendarEventRepo = buildMockCalendarEventRepo();
    importRepo.findById.mockResolvedValue(makeImport());
    calendarEventRepo.list.mockResolvedValue([makeEvent()]);
    const service = createCsvImportService(mappingService, importRepo, calendarEventRepo);

    const result = await service.confirmImport(USER_ID, "import-1");

    expect(result).toEqual({ inserted: 1, duplicates: 1, total: 2 });
    expect(calendarEventRepo.createMany).toHaveBeenCalledOnce();
    const created = calendarEventRepo.createMany.mock.calls[0]![0];
    expect(created).toHaveLength(1);
    expect(created![0]).toMatchObject({
      userId: USER_ID,
      title: "Grocery",
      start: "2026-03-20",
      amount: -50,
      type: "credit",
    });
  });

  it("inserts all rows when no duplicates exist", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const calendarEventRepo = buildMockCalendarEventRepo();
    importRepo.findById.mockResolvedValue(makeImport());
    calendarEventRepo.list.mockResolvedValue([]);
    const service = createCsvImportService(mappingService, importRepo, calendarEventRepo);

    const result = await service.confirmImport(USER_ID, "import-1");

    expect(result).toEqual({ inserted: 2, duplicates: 0, total: 2 });
    expect(calendarEventRepo.createMany).toHaveBeenCalledOnce();
    const created = calendarEventRepo.createMany.mock.calls[0]![0];
    expect(created).toHaveLength(2);
  });

  it("inserts nothing when all rows are duplicates", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const calendarEventRepo = buildMockCalendarEventRepo();
    importRepo.findById.mockResolvedValue(makeImport());
    calendarEventRepo.list.mockResolvedValue([
      makeEvent(),
      makeEvent({
        title: "Grocery",
        start: "2026-03-20T00:00:00.000Z",
        amount: -50,
        type: "credit",
      }),
    ]);
    const service = createCsvImportService(mappingService, importRepo, calendarEventRepo);

    const result = await service.confirmImport(USER_ID, "import-1");

    expect(result).toEqual({ inserted: 0, duplicates: 2, total: 2 });
    expect(calendarEventRepo.createMany).not.toHaveBeenCalled();
  });

  it("deletes the temporary import after successful insert", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const calendarEventRepo = buildMockCalendarEventRepo();
    importRepo.findById.mockResolvedValue(makeImport());
    const service = createCsvImportService(mappingService, importRepo, calendarEventRepo);

    await service.confirmImport(USER_ID, "import-1");

    expect(importRepo.delete).toHaveBeenCalledWith("import-1");
  });

  it("passes correct CalendarEventCreate shape to createMany", async () => {
    const mappingService = buildMockMappingService();
    const importRepo = buildMockImportRepo();
    const calendarEventRepo = buildMockCalendarEventRepo();
    const singleRowImport = makeImport({
      data: [{ id: "row-1", title: "Rent", start: "2026-04-01", amount: 1200, type: "debit" }],
    });
    importRepo.findById.mockResolvedValue(singleRowImport);
    const service = createCsvImportService(mappingService, importRepo, calendarEventRepo);

    await service.confirmImport(USER_ID, "import-1");

    expect(calendarEventRepo.createMany).toHaveBeenCalledWith([
      {
        userId: USER_ID,
        title: "Rent",
        start: "2026-04-01",
        amount: 1200,
        type: "debit",
      },
    ]);
  });
});
