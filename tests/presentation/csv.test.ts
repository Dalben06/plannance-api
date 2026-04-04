import { describe, it, expect, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { createApp } from "../../src/app.js";
import { buildAppDependencies, sendRequest } from "../testUtils.js";
import type { CsvMappingResult, CsvMappingTemplate } from "../../src/domain/csv.js";
import { HttpError } from "../../src/presentation/middleware/errorHandler.js";
import { mapCsvColumnsHandler } from "../../src/presentation/handlers/csvHandlers.js";

const AUTH_HEADER = "Bearer test-token";
const CSV_CONTENT = `name,age,active\nAlice,30,true\nBob,25,false`;
const MAPPED_RESULT: CsvMappingResult = {
  columns: [
    { name: "name", type: "string" },
    { name: "age", type: "number" },
    { name: "active", type: "boolean" },
  ],
};

const buildMultipartCsvRequest = (content: Buffer | string, filename = "data.csv") => {
  const boundary = "----PlannanceBoundary";
  const fileContent = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const preamble = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      "Content-Type: text/csv\r\n\r\n"
  );
  const closing = Buffer.from(`\r\n--${boundary}--\r\n`);

  return {
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: Buffer.concat([preamble, fileContent, closing]),
  };
};

describe("POST /api/v1/csv/mapped", () => {
  it("401: returns error when no auth token is provided", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/mapped",
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
    expect(deps.authService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it("400: returns error when no file is attached", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/mapped",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "No file provided" });
  });

  it("400: rejects upload when file exceeds 5MB limit", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/mapped",
      headers: {
        Authorization: AUTH_HEADER,
        ...buildMultipartCsvRequest(bigBuffer, "big.csv").headers,
      },
      body: buildMultipartCsvRequest(bigBuffer, "big.csv").body,
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "File exceeds 5MB limit" });
  });
});

const buildMockResponse = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));

  return {
    res: { json, status } as unknown as Response,
    json,
    status,
  };
};

describe("mapCsvColumnsHandler", () => {
  it("returns mapped columns when valid CSV is provided", async () => {
    const deps = buildAppDependencies();
    deps.csvService.mapColumns.mockResolvedValue(MAPPED_RESULT);
    const handler = mapCsvColumnsHandler(deps.csvService);
    const req = {
      file: { buffer: Buffer.from(CSV_CONTENT) },
    } as Request;
    const { res, json } = buildMockResponse();
    const next = vi.fn<NextFunction>();

    await handler(req, res, next);

    expect(deps.csvService.mapColumns).toHaveBeenCalledWith(Buffer.from(CSV_CONTENT));
    expect(json).toHaveBeenCalledWith({ columns: MAPPED_RESULT.columns });
    expect(next).not.toHaveBeenCalled();
  });

  it("passes HttpError to next when the CSV service rejects", async () => {
    const deps = buildAppDependencies();
    const error = new HttpError("Invalid or corrupted CSV file", 400);
    deps.csvService.mapColumns.mockRejectedValue(error);
    const handler = mapCsvColumnsHandler(deps.csvService);
    const req = {
      file: { buffer: Buffer.from(CSV_CONTENT) },
    } as Request;
    const { res } = buildMockResponse();
    const next = vi.fn<NextFunction>();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("passes unexpected errors to next", async () => {
    const deps = buildAppDependencies();
    const error = new Error("Unexpected failure");
    deps.csvService.mapColumns.mockRejectedValue(error);
    const handler = mapCsvColumnsHandler(deps.csvService);
    const req = {
      file: { buffer: Buffer.from(CSV_CONTENT) },
    } as Request;
    const { res } = buildMockResponse();
    const next = vi.fn<NextFunction>();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("returns HttpError when no file is provided", async () => {
    const deps = buildAppDependencies();
    const handler = mapCsvColumnsHandler(deps.csvService);
    const req = {} as Request;
    const { res } = buildMockResponse();
    const next = vi.fn<NextFunction>();

    await handler(req, res, next);

    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(400);
    expect((error as HttpError).message).toBe("No file provided");
  });
});

const makeTemplate = (overrides: Partial<CsvMappingTemplate> = {}): CsvMappingTemplate => ({
  id: "tpl-1",
  userId: "user-123",
  name: "bank-export",
  mappings: [
    { from: "Date", to: "startAt" },
    { from: "Amount", to: "amount" },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("GET /api/v1/csv/mapping", () => {
  it("401: returns error when no auth token is provided", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/mapping",
    });

    expect(res.status).toBe(401);
  });

  it("200: returns the user's saved mappings", async () => {
    const deps = buildAppDependencies();
    const templates = [makeTemplate()];
    deps.csvMappingService.listMappings.mockResolvedValue(templates);
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/mapping",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: templates });
    expect(deps.csvMappingService.listMappings).toHaveBeenCalledWith("user-123");
  });

  it("200: returns empty array when user has no mappings", async () => {
    const deps = buildAppDependencies();
    deps.csvMappingService.listMappings.mockResolvedValue([]);
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/csv/mapping",
      headers: { Authorization: AUTH_HEADER },
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });
});

describe("POST /api/v1/csv/mapping", () => {
  it("401: returns error when no auth token is provided", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/mapping",
      body: {
        name: "bank-export",
        mappings: [{ from: "Date", to: "startAt" }],
      },
    });

    expect(res.status).toBe(401);
  });

  it("201: saves and returns the new mapping template", async () => {
    const deps = buildAppDependencies();
    const created = makeTemplate();
    deps.csvMappingService.saveMapping.mockResolvedValue(created);
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/mapping",
      headers: { Authorization: AUTH_HEADER },
      body: { name: "bank-export", mappings: [{ from: "Date", to: "startAt" }] },
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: created });
    expect(deps.csvMappingService.saveMapping).toHaveBeenCalledWith("user-123", {
      name: "bank-export",
      mappings: [{ from: "Date", to: "startAt" }],
    });
  });

  it("400: returns validation error when name is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/mapping",
      headers: { Authorization: AUTH_HEADER },
      body: { mappings: [{ from: "Date", to: "startAt" }] },
    });

    expect(res.status).toBe(400);
  });

  it("400: returns validation error when mappings array is empty", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/mapping",
      headers: { Authorization: AUTH_HEADER },
      body: { name: "test", mappings: [] },
    });

    expect(res.status).toBe(400);
  });

  it("400: returns validation error when 'to' is not a valid CalendarEvent field", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/csv/mapping",
      headers: { Authorization: AUTH_HEADER },
      body: { name: "test", mappings: [{ from: "Date", to: "invalidField" }] },
    });

    expect(res.status).toBe(400);
  });
});
