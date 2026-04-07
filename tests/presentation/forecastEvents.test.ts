import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { buildAppDependencies, sendRequest } from "../testUtils.js";

const sample = {
  id: "fc-uuid-1",
  userId: "user-123",
  name: "Rent",
  day: 5,
  amount: 1200,
  type: "debit" as const,
  startDate: "2026-01-01T00:00:00.000Z",
  endDate: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const validBody = {
  name: "Rent",
  day: 5,
  amount: 1200,
  type: "debit",
  startDate: "2026-01-01",
};

describe("forecast events routes", () => {
  it("requires authentication", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const response = await sendRequest(app, { method: "GET", url: "/api/v1/forecast" });

    expect(response.status).toBe(401);
    expect(deps.forecastEventService.listForecasts).not.toHaveBeenCalled();
  });

  it("lists forecasts for the authenticated user", async () => {
    const deps = buildAppDependencies();
    deps.forecastEventService.listForecasts.mockResolvedValue([sample]);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/forecast",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect((response.body as { data: unknown[] }).data).toHaveLength(1);
    expect(deps.forecastEventService.listForecasts).toHaveBeenCalledWith("user-123");
  });

  it("gets a single forecast", async () => {
    const deps = buildAppDependencies();
    deps.forecastEventService.getForecastById.mockResolvedValue(sample);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/forecast/fc-uuid-1",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(deps.forecastEventService.getForecastById).toHaveBeenCalledWith("fc-uuid-1", "user-123");
  });

  it("returns 404 when forecast not found", async () => {
    const deps = buildAppDependencies();
    deps.forecastEventService.getForecastById.mockResolvedValue(null);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/forecast/missing",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(404);
  });

  it("creates a forecast", async () => {
    const deps = buildAppDependencies();
    deps.forecastEventService.createForecast.mockResolvedValue(sample);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/forecast",
      headers: { Authorization: "Bearer test-token" },
      body: validBody,
    });

    expect(response.status).toBe(201);
    expect(deps.forecastEventService.createForecast).toHaveBeenCalledWith("user-123", validBody);
  });

  it("propagates 500 when service throws", async () => {
    const deps = buildAppDependencies();
    deps.forecastEventService.createForecast.mockRejectedValue(new Error("boom"));
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/forecast",
      headers: { Authorization: "Bearer test-token" },
      body: validBody,
    });

    expect(response.status).toBe(500);
  });

  describe("validation (400)", () => {
    const cases: Array<[string, Record<string, unknown>]> = [
      ["missing name", { ...validBody, name: undefined }],
      ["name too long", { ...validBody, name: "x".repeat(256) }],
      ["day below 1", { ...validBody, day: 0 }],
      ["day above 31", { ...validBody, day: 32 }],
      ["amount zero", { ...validBody, amount: 0 }],
      ["amount negative", { ...validBody, amount: -1 }],
      ["invalid type", { ...validBody, type: "transfer" }],
      ["startDate in future", { ...validBody, startDate: "2999-01-01" }],
      ["endDate equal to startDate", { ...validBody, endDate: validBody.startDate }],
      ["endDate before startDate", { ...validBody, endDate: "2025-12-31" }],
    ];

    for (const [label, body] of cases) {
      it(label, async () => {
        const deps = buildAppDependencies();
        const app = createApp(deps);

        const response = await sendRequest(app, {
          method: "POST",
          url: "/api/v1/forecast",
          headers: { Authorization: "Bearer test-token" },
          body,
        });

        expect(response.status).toBe(400);
        expect(deps.forecastEventService.createForecast).not.toHaveBeenCalled();
      });
    }
  });

  it("updates a forecast", async () => {
    const deps = buildAppDependencies();
    deps.forecastEventService.updateForecast.mockResolvedValue(sample);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/forecast/fc-uuid-1",
      headers: { Authorization: "Bearer test-token" },
      body: { name: "Updated" },
    });

    expect(response.status).toBe(200);
    expect(deps.forecastEventService.updateForecast).toHaveBeenCalledWith("fc-uuid-1", "user-123", {
      name: "Updated",
    });
  });

  it("returns 404 on update when missing", async () => {
    const deps = buildAppDependencies();
    deps.forecastEventService.updateForecast.mockResolvedValue(null);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/forecast/missing",
      headers: { Authorization: "Bearer test-token" },
      body: { name: "Updated" },
    });

    expect(response.status).toBe(404);
  });

  it("deletes a forecast", async () => {
    const deps = buildAppDependencies();
    deps.forecastEventService.deleteForecast.mockResolvedValue(true);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "DELETE",
      url: "/api/v1/forecast/fc-uuid-1",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(204);
    expect(deps.forecastEventService.deleteForecast).toHaveBeenCalledWith("fc-uuid-1", "user-123");
  });

  it("returns 404 on delete when missing", async () => {
    const deps = buildAppDependencies();
    deps.forecastEventService.deleteForecast.mockResolvedValue(false);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "DELETE",
      url: "/api/v1/forecast/missing",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(404);
  });
});
