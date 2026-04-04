import multer from "multer";
import { describe, expect, it, vi } from "vitest";
import { handleMulterError } from "../../../src/presentation/middleware/upload.js";
import { HttpError } from "../../../src/presentation/middleware/errorHandler.js";
import type { NextFunction, Request, Response } from "express";

const mockReq = {} as Request;
const mockRes = {} as Response;

describe("handleMulterError", () => {
  it("calls next with HttpError for non-LIMIT_FILE_SIZE MulterError", () => {
    const next = vi.fn<NextFunction>();
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE");

    handleMulterError(err, mockReq, mockRes, next);

    expect(next).toHaveBeenCalledOnce();
    const called = next.mock.calls[0]?.[0];
    expect(called).toBeInstanceOf(HttpError);
    expect((called as HttpError).message).toBe(`File upload error: ${err.message}`);
    expect((called as HttpError).status).toBe(400);
  });

  it("calls next with the original error for non-Multer errors", () => {
    const next = vi.fn<NextFunction>();
    const err = new Error("something else");

    handleMulterError(err, mockReq, mockRes, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toBe(err);
  });
});
