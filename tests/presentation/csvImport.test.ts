import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { buildAppDependencies, sendRequest } from "../testUtils.js";
import type { CsvImportResult } from "../../src/domain/csvImport.js";
import type { CsvConfirmResult } from "../../src/domain/calendarEvent.js";
import { HttpError } from "../../src/presentation/middleware/errorHandler.js";

const AUTH_HEADER = "Bearer test-token";

const CSV_CONTENT = "Date,Amount,Description\n2026-03-15,100,Salary";

const makeImportResult = (overrides: Partial<CsvImportResult> = {}): CsvImportResult => ({
  id: "import-1",
  userId: "user-123",
  errorsLines: [],
  data: [
    {
      id: "row-1",
      title: "Salary",
      start: "2026-03-15",
      amount: 100,
      type: "debit",
    },
  ],
  createdAt: "2026-04-04T00:00:00.000Z",
  expiresAt: "2026-04-04T03:00:00.000Z",
  ...overrides,
});

describe("POST /api/v1/csv/import", () => {
  it("401: returns error when no auth token is provided", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/import",
    });

    expect(res.status).toBe(401);
  });

  it("400: returns error when no file is attached", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "No file provided" });
  });

  it("400: returns error when templateId is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await request(app)
      .post("/api/v1/csv/import")
      .set("Authorization", AUTH_HEADER)
      .attach("file", Buffer.from(CSV_CONTENT), { filename: "data.csv", contentType: "text/csv" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "templateId is required" });
  });

  it("400: returns error when service throws HttpError (invalid template)", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.importCsv.mockRejectedValue(new HttpError("Invalid templateId", 400));
    const app = createApp(deps);

    const res = await request(app)
      .post("/api/v1/csv/import")
      .set("Authorization", AUTH_HEADER)
      .field("templateId", "bad-tpl")
      .attach("file", Buffer.from(CSV_CONTENT), { filename: "data.csv", contentType: "text/csv" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid templateId" });
  });

  it("201: returns import result with id, data, errorsLines, and expiresAt", async () => {
    const deps = buildAppDependencies();
    const importResult = makeImportResult();
    deps.csvImportService.importCsv.mockResolvedValue(importResult);
    const app = createApp(deps);

    const res = await request(app)
      .post("/api/v1/csv/import")
      .set("Authorization", AUTH_HEADER)
      .field("templateId", "tpl-1")
      .attach("file", Buffer.from(CSV_CONTENT), { filename: "data.csv", contentType: "text/csv" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: importResult.id,
      errorsLines: importResult.errorsLines,
      data: importResult.data,
      expiresAt: importResult.expiresAt,
    });
  });

  it("500: returns internal server error when unexpected error occurs", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.importCsv.mockRejectedValue(new Error("Unexpected failure"));
    const app = createApp(deps);

    const res = await request(app)
      .post("/api/v1/csv/import")
      .set("Authorization", AUTH_HEADER)
      .field("templateId", "tpl-1")
      .attach("file", Buffer.from(CSV_CONTENT), { filename: "data.csv", contentType: "text/csv" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("PUT /api/v1/csv/import", () => {
  const makeUpdateBody = () => ({
    id: "import-1",
    data: [
      {
        id: "row-1",
        title: "Salary",
        start: "2026-03-15",
        amount: 100,
        type: "debit",
      },
    ],
    errorsLines: [],
  });

  it("401: returns error when no auth token is provided", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/csv/import",
      body: makeUpdateBody(),
    });

    expect(res.status).toBe(401);
  });

  it("400: returns error when id is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const body = makeUpdateBody();
    const { id: _, ...bodyWithoutId } = body;

    const res = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
      body: bodyWithoutId,
    });

    expect(res.status).toBe(400);
  });

  it("400: returns error when data is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const { data: _, ...bodyWithoutData } = makeUpdateBody();

    const res = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
      body: bodyWithoutData,
    });

    expect(res.status).toBe(400);
  });

  it("400: returns error when errorsLines is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const { errorsLines: _, ...bodyWithoutErrors } = makeUpdateBody();

    const res = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
      body: bodyWithoutErrors,
    });

    expect(res.status).toBe(400);
  });

  it("400: returns error when updated data contains an invalid date", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const body = makeUpdateBody();
    body.data[0]!.start = "not-a-date";

    const res = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
      body,
    });

    expect(res.status).toBe(400);
  });

  it("404: returns error when import is not found", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.updateImport.mockRejectedValue(new HttpError("Import not found", 404));
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
      body: makeUpdateBody(),
    });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Import not found" });
  });

  it("200: returns updated import result", async () => {
    const deps = buildAppDependencies();
    const importResult = makeImportResult();
    deps.csvImportService.updateImport.mockResolvedValue(importResult);
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
      body: makeUpdateBody(),
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: importResult.id,
      errorsLines: importResult.errorsLines,
      data: importResult.data,
      expiresAt: importResult.expiresAt,
    });
  });

  it("500: returns internal server error when unexpected error occurs", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.updateImport.mockRejectedValue(new Error("DB failure"));
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
      body: makeUpdateBody(),
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("GET /api/v1/csv/import", () => {
  it("401: returns error when no auth token is provided", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/import",
    });

    expect(res.status).toBe(401);
  });

  it("200: returns pending imports for the authenticated user", async () => {
    const deps = buildAppDependencies();
    const imports = [makeImportResult(), makeImportResult({ id: "import-2" })];
    deps.csvImportService.listPendingImports.mockResolvedValue(imports);
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: imports });
    expect(deps.csvImportService.listPendingImports).toHaveBeenCalledWith("user-123");
  });

  it("404: returns error when no pending imports are found", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.listPendingImports.mockRejectedValue(
      new HttpError("No pending imports found", 404)
    );
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "No pending imports found" });
  });

  it("500: returns internal server error when unexpected error occurs", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.listPendingImports.mockRejectedValue(new Error("DB failure"));
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/import",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("GET /api/v1/csv/import/:id", () => {
  it("401: returns error when no auth token is provided", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/import/import-1",
    });

    expect(res.status).toBe(401);
  });

  it("400: returns error when import is not found or does not belong to the user", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.getImportById.mockRejectedValue(new HttpError("Import not found", 400));
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/import/non-existent",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Import not found" });
  });

  it("200: returns the import result for a valid id", async () => {
    const deps = buildAppDependencies();
    const importResult = makeImportResult();
    deps.csvImportService.getImportById.mockResolvedValue(importResult);
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/import/import-1",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: importResult.id,
      errorsLines: importResult.errorsLines,
      data: importResult.data,
      expiresAt: importResult.expiresAt,
    });
    expect(deps.csvImportService.getImportById).toHaveBeenCalledWith("user-123", "import-1");
  });

  it("500: returns internal server error when unexpected error occurs", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.getImportById.mockRejectedValue(new Error("DB failure"));
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/import/import-1",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("POST /api/v1/csv/confirm/:id", () => {
  it("401: returns error when no auth token is provided", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/confirm/import-1",
    });

    expect(res.status).toBe(401);
  });

  it("400: returns error when import is not found", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.confirmImport.mockRejectedValue(new HttpError("Import not found", 400));
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/confirm/non-existent",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Import not found" });
  });

  it("400: returns error when import has validation errors", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.confirmImport.mockRejectedValue(
      new HttpError("Import still has validation errors", 400)
    );
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/confirm/import-1",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Import still has validation errors" });
  });

  it("200: returns confirm result with counts", async () => {
    const deps = buildAppDependencies();
    const confirmResult: CsvConfirmResult = { inserted: 3, duplicates: 1, total: 4 };
    deps.csvImportService.confirmImport.mockResolvedValue(confirmResult);
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/confirm/import-1",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: confirmResult });
    expect(deps.csvImportService.confirmImport).toHaveBeenCalledWith("user-123", "import-1");
  });

  it("500: returns internal server error when unexpected error occurs", async () => {
    const deps = buildAppDependencies();
    deps.csvImportService.confirmImport.mockRejectedValue(new Error("Processing error"));
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/confirm/import-1",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
