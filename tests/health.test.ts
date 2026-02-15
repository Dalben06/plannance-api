import request from "supertest";
import { createApp } from "../src/app.js";
import { buildMockCalendarEventService } from "./testUtils.js";
import { describe, expect, it } from "vitest";

describe("health route", () => {
  it("returns ok", async () => {
    const app = createApp({ calendarEventService: buildMockCalendarEventService() });

    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.time).toBeDefined();
  });
});
