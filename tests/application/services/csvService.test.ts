import { describe, it, expect } from "vitest";
import { createCsvService } from "../../../src/application/services/csvService.js";
import { HttpError } from "../../../src/presentation/middleware/errorHandler.js";

const toBuffer = (content: string): Buffer => Buffer.from(content, "utf-8");

describe("csvService.mapColumns", () => {
  const service = createCsvService();

  it("correctly infers all four types from a well-formed CSV", async () => {
    const csv = `name,age,active,birthdate\nAlice,30,true,1994-01-15\nBob,25,false,1999-06-20`;
    const result = await service.mapColumns(toBuffer(csv));

    expect(result.columns).toEqual([
      { name: "name", type: "string" },
      { name: "age", type: "number" },
      { name: "active", type: "boolean" },
      { name: "birthdate", type: "date" },
    ]);
  });

  it("falls back to string for mixed-type column values", async () => {
    const csv = `value\n42\nhello\n2024-01-01`;
    const result = await service.mapColumns(toBuffer(csv));

    expect(result.columns).toEqual([{ name: "value", type: "string" }]);
  });

  it("returns string type when column has no data rows (header-only CSV)", async () => {
    const csv = `name,age,active`;
    const result = await service.mapColumns(toBuffer(csv));

    expect(result.columns).toEqual([
      { name: "name", type: "string" },
      { name: "age", type: "string" },
      { name: "active", type: "string" },
    ]);
  });

  it("throws HttpError on corrupt/malformed CSV (unterminated quoted field)", async () => {
    // An unterminated quoted field causes csv-parse to emit a parse error
    const corrupt = toBuffer('"unclosed quote field');
    await expect(service.mapColumns(corrupt)).rejects.toThrow(HttpError);
    await expect(service.mapColumns(corrupt)).rejects.toMatchObject({
      status: 400,
      message: "Invalid or corrupted CSV file",
    });
  });

  it("handles integers and floats as number", async () => {
    const csv = `int_col,float_col\n1,1.5\n2,2.75\n3,3.0`;
    const result = await service.mapColumns(toBuffer(csv));

    expect(result.columns).toEqual([
      { name: "int_col", type: "number" },
      { name: "float_col", type: "number" },
    ]);
  });
});
