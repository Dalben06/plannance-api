import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { buildAppDependencies } from "../testUtils.js";
import type { CsvMappingResult } from "../../src/domain/csv.js";
import { HttpError } from "../../src/presentation/middleware/errorHandler.js";

const CSV_CONTENT = `name,age,active\nAlice,30,true\nBob,25,false`;
const MAPPED_RESULT: CsvMappingResult = {
  columns: [
    { name: "name", type: "string" },
    { name: "age", type: "number" },
    { name: "active", type: "boolean" },
  ],
};

describe("POST /api/v1/csv/mapped", () => {
  it("200 OK: returns mapped columns when valid CSV is provided", async () => {
    const deps = buildAppDependencies();
    deps.csvService.mapColumns.mockResolvedValue(MAPPED_RESULT);
    const app = createApp(deps);

    const res = await request(app)
      .post("/api/v1/csv/mapped")
      .attach("file", Buffer.from(CSV_CONTENT), { filename: "data.csv", contentType: "text/csv" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ columns: MAPPED_RESULT.columns });
    expect(deps.csvService.mapColumns).toHaveBeenCalledOnce();
  });

  it("400: returns error when no file is attached", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const res = await request(app).post("/api/v1/csv/mapped");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "No file provided" });
  });

  it("400: rejects upload when file exceeds 5MB limit", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);

    // When multer's file size limit is exceeded it may abort the connection (ECONNRESET)
    // before the response is received, or it may return a 400 — both indicate the file was rejected.
    let status: number | undefined;
    try {
      const res = await request(app)
        .post("/api/v1/csv/mapped")
        .attach("file", bigBuffer, { filename: "big.csv", contentType: "text/csv" });
      status = res.status;
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      expect(["ECONNRESET", "ECONNABORTED"]).toContain(code);
      return;
    }
    expect(status).toBe(400);
  });

  it("400: returns error when service rejects with HttpError", async () => {
    const deps = buildAppDependencies();
    deps.csvService.mapColumns.mockRejectedValue(
      new HttpError("Invalid or corrupted CSV file", 400)
    );
    const app = createApp(deps);

    const res = await request(app)
      .post("/api/v1/csv/mapped")
      .attach("file", Buffer.from(CSV_CONTENT), { filename: "data.csv", contentType: "text/csv" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid or corrupted CSV file" });
  });

  it("500: returns internal server error when service throws unexpected error", async () => {
    const deps = buildAppDependencies();
    deps.csvService.mapColumns.mockRejectedValue(new Error("Unexpected failure"));
    const app = createApp(deps);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app)
      .post("/api/v1/csv/mapped")
      .attach("file", Buffer.from(CSV_CONTENT), { filename: "data.csv", contentType: "text/csv" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });

    consoleSpy.mockRestore();
  });
});
