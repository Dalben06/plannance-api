import request from "supertest";
import { createApp } from "../src/app.js";
import { describe, expect, it } from "vitest";
import { buildMockCalendarEventService } from "./testUtils.js";

const sampleEvent = {
  id: "1",
  userId: "user-123",
  title: "Payday",
  start: "2026-01-05T00:00:00.000Z",
  end: null,
  amount: 1500,
  type: "credit" as const,
  color: "#00C853",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

describe("calendar events routes", () => {
  it("lists events", async () => {
    const service = buildMockCalendarEventService();
    service.listEvents.mockResolvedValue([sampleEvent]);
    const app = createApp({ calendarEventService: service });

    const response = await request(app).get("/api/v1/calendar-events?month=2026-01");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(service.listEvents).toHaveBeenCalledWith({
      userId: undefined,
      month: "2026-01",
      weekStartsOn: 0,
    });
  });

  it("gets a single event", async () => {
    const service = buildMockCalendarEventService();
    service.getEventById.mockResolvedValue(sampleEvent);
    const app = createApp({ calendarEventService: service });

    const response = await request(app).get("/api/v1/calendar-events/1");

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe("1");
  });

  it("returns 404 when missing", async () => {
    const service = buildMockCalendarEventService();
    service.getEventById.mockResolvedValue(null);
    const app = createApp({ calendarEventService: service });

    const response = await request(app).get("/api/v1/calendar-events/999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Calendar event not found");
  });

  it("creates an event", async () => {
    const service = buildMockCalendarEventService();
    service.createEvent.mockResolvedValue(sampleEvent);
    const app = createApp({ calendarEventService: service });

    const response = await request(app)
      .post("/api/v1/calendar-events")
      .send({
        userId: sampleEvent.userId,
        title: sampleEvent.title,
        start: sampleEvent.start,
        end: sampleEvent.end,
        amount: sampleEvent.amount,
        type: sampleEvent.type,
        color: sampleEvent.color
      });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe("1");
  });

  it("updates an event", async () => {
    const service = buildMockCalendarEventService();
    service.updateEvent.mockResolvedValue(sampleEvent);
    const app = createApp({ calendarEventService: service });

    const response = await request(app)
      .put("/api/v1/calendar-events/1")
      .send({ title: "Updated" });

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe("Payday");
  });

  it("returns 404 on update when missing", async () => {
    const service = buildMockCalendarEventService();
    service.updateEvent.mockResolvedValue(null);
    const app = createApp({ calendarEventService: service });

    const response = await request(app)
      .put("/api/v1/calendar-events/999")
      .send({ title: "Updated" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Calendar event not found");
  });

  it("deletes an event", async () => {
    const service = buildMockCalendarEventService();
    service.deleteEvent.mockResolvedValue(true);
    const app = createApp({ calendarEventService: service });

    const response = await request(app).delete("/api/v1/calendar-events/1");

    expect(response.status).toBe(204);
  });

  it("returns 404 on delete when missing", async () => {
    const service = buildMockCalendarEventService();
    service.deleteEvent.mockResolvedValue(false);
    const app = createApp({ calendarEventService: service });

    const response = await request(app).delete("/api/v1/calendar-events/999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Calendar event not found");
  });
});
