import { vi, type MockedFunction } from "vitest";
import type { Application } from "express";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import type { AuthService } from "../src/application/services/authService.js";
import type { CalendarDayService } from "../src/application/services/calendarDayService.js";
import type { CalendarEventService } from "../src/application/services/calendarEventService.js";
import type { UserService } from "../src/application/services/userService.js";
import type { CsvService } from "../src/application/services/csvService.js";
import type { CsvMappingService } from "../src/application/services/csvMappingService.js";
import type { CsvImportService } from "../src/application/services/csvImportService.js";
import type { AuthenticatedUser } from "../src/domain/auth.js";

type MockedService<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: T[K] extends (...args: any[]) => any ? MockedFunction<T[K]> : T[K];
};

export const buildMockCalendarEventService = (): MockedService<CalendarEventService> => ({
  listEvents: vi.fn<CalendarEventService["listEvents"]>(),
  getEventById: vi.fn<CalendarEventService["getEventById"]>(),
  createEvent: vi.fn<CalendarEventService["createEvent"]>(),
  updateEvent: vi.fn<CalendarEventService["updateEvent"]>(),
  deleteEvent: vi.fn<CalendarEventService["deleteEvent"]>(),
});

export const buildMockCalendarDayService = (): MockedService<CalendarDayService> => ({
  listMonthSummary: vi.fn<CalendarDayService["listMonthSummary"]>(),
});

export const buildMockAuthService = (): MockedService<AuthService> => ({
  authenticate: vi.fn<AuthService["authenticate"]>(),
  verifyAccessToken: vi.fn<AuthService["verifyAccessToken"]>(),
});

export const buildMockUserService = (): MockedService<UserService> => ({
  create: vi.fn<UserService["create"]>(),
});

export const buildMockCsvService = (): MockedService<CsvService> => ({
  mapColumns: vi.fn<CsvService["mapColumns"]>(),
});

export const buildMockCsvMappingService = (): MockedService<CsvMappingService> => ({
  findById: vi.fn<CsvMappingService["findById"]>(),
  listMappings: vi.fn<CsvMappingService["listMappings"]>(),
  saveMapping: vi.fn<CsvMappingService["saveMapping"]>(),
});

export const buildMockCsvImportService = (): MockedService<CsvImportService> => ({
  listPendingImports: vi.fn<CsvImportService["listPendingImports"]>(),
  importCsv: vi.fn<CsvImportService["importCsv"]>(),
});

export const sampleAuthenticatedUser: AuthenticatedUser = {
  id: "user-123",
  email: "user@example.com",
  name: "Plannance User",
  picture: "https://example.com/avatar.png",
  emailVerified: true,
};

export const buildAppDependencies = () => {
  const calendarEventService = buildMockCalendarEventService();
  const calendarDaysService = buildMockCalendarDayService();
  const authService = buildMockAuthService();
  const userService = buildMockUserService();
  const csvService = buildMockCsvService();
  const csvMappingService = buildMockCsvMappingService();
  const csvImportService = buildMockCsvImportService();

  authService.verifyAccessToken.mockReturnValue(sampleAuthenticatedUser);

  return {
    calendarEventService,
    calendarDaysService,
    authService,
    userService,
    csvService,
    csvMappingService,
    csvImportService,
  };
};

type RequestOptions = {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: Buffer | string | unknown;
};

type TestResponse = {
  status: number;
  headers: Record<string, string | string[] | number | undefined>;
  body: unknown;
  text: string;
};

/**
 * Sends a mock HTTP request to the given Express app and returns a response object.
 * @param app - The Express application instance.
 * @param options - The request options including method, url, headers, and body.
 * @returns An object containing status, headers, body (parsed JSON if possible), and text (raw response body).
 */
export const sendRequest = async (
  app: Application,
  options: RequestOptions
): Promise<TestResponse> => {
  const req = new IncomingMessage(new Socket());
  req.method = options.method.toUpperCase();
  req.url = options.url;
  req.headers = {};

  if (options.headers) {
    const seenHeaderKeys = new Set<string>();
    for (const [key, value] of Object.entries(options.headers)) {
      const lowerKey = key.toLowerCase();
      if (seenHeaderKeys.has(lowerKey)) {
        console.warn(`Duplicate header key detected: "${key}". Only the last value will be used.`);
      }
      seenHeaderKeys.add(lowerKey);
      req.headers[lowerKey] = value;
    }
  }

  // Ensure a default host header is present
  if (!req.headers["host"]) {
    req.headers["host"] = "localhost";
  }

  let payload: Buffer | string | undefined;
  if (options.body !== undefined) {
    payload =
      Buffer.isBuffer(options.body) || typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
    if (!req.headers["content-type"]) {
      req.headers["content-type"] = Buffer.isBuffer(options.body)
        ? "application/octet-stream"
        : "application/json";
    }
    req.headers["content-length"] = Buffer.byteLength(payload).toString();
  }

  const res = new ServerResponse(req);
  const chunks: Buffer[] = [];

  // NOTE: Overriding res.write and res.end is effective for capturing output in tests,
  // but this approach may break if Express or Node.js internals change in the future.
  // If you encounter issues, consider using a dedicated HTTP mocking library.
  res.write = ((chunk: unknown, encoding?: BufferEncoding, cb?: () => void) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding));
    }
    if (cb) cb();
    return true;
  }) as typeof res.write;

  return new Promise<TestResponse>((resolve) => {
    res.end = ((chunk?: unknown, encoding?: BufferEncoding, cb?: () => void) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding));
      }
      if (cb) cb();
      const text = Buffer.concat(chunks).toString("utf8");
      let body: unknown = undefined;
      if (text.length > 0) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      resolve({
        status: res.statusCode,
        headers: res.getHeaders() as TestResponse["headers"],
        body,
        text,
      });
      return res;
    }) as typeof res.end;

    app(req, res);

    process.nextTick(() => {
      if (payload !== undefined) {
        req.push(payload);
      }
      req.push(null);
    });
  });
};
