import { createApp } from "../../src/app.js";
import { describe, expect, it } from "vitest";
import { buildAppDependencies, sendRequest, sampleAuthenticatedUser } from "../testUtils.js";
import type { CalendarDay } from "../../src/domain/calendarDay.js";

const sampleCalendarDay: CalendarDay = {
  date: new Date(2026, 2, 1),
  events: [],
  expense: 0,
  income: 0,
};

describe("GET /api/v1/calendar-day", () => {
  it("returns 401 when no Authorization header is provided", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/calendar-day?month=2026-03",
    });

    expect(response.status).toBe(401);
    expect(deps.calendarDaysService.listMonthSummary).not.toHaveBeenCalled();
  });

  it("returns 200 with data array when authenticated and service resolves", async () => {
    const deps = buildAppDependencies();
    deps.calendarDaysService.listMonthSummary.mockResolvedValue([sampleCalendarDay]);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/calendar-day?month=2026-03",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("passes userId from auth token (not from query) and correct month/weekStartsOn to service", async () => {
    const deps = buildAppDependencies();
    deps.calendarDaysService.listMonthSummary.mockResolvedValue([]);
    const app = createApp(deps);

    await sendRequest(app, {
      method: "GET",
      url: "/api/v1/calendar-day?month=2026-03&weekStartsOn=1&userId=spoofed-user",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(deps.calendarDaysService.listMonthSummary).toHaveBeenCalledWith({
      userId: sampleAuthenticatedUser.id,
      month: "2026-03",
      weekStartsOn: 1,
    });
    expect(deps.authService.verifyAccessToken).toHaveBeenCalledWith("test-token");
  });

  it("returns 400 when month query param is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/calendar-day",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(400);
    expect(deps.calendarDaysService.listMonthSummary).not.toHaveBeenCalled();
  });
});
