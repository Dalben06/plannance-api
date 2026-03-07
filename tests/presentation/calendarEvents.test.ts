import { createApp } from "../../src/app.js";
import { describe, expect, it } from "vitest";
import { buildAppDependencies, sendRequest } from "../testUtils.js";

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
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("calendar events routes", () => {
  it("requires authentication", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/calendar-events?month=2026-01",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Authentication required");
    expect(deps.calendarEventService.listEvents).not.toHaveBeenCalled();
  });

  it("lists events", async () => {
    const deps = buildAppDependencies();
    deps.calendarEventService.listEvents.mockResolvedValue([sampleEvent]);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/calendar-events?month=2026-01&userId=spoofed-user&weekStartsOn=1",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(deps.calendarEventService.listEvents).toHaveBeenCalledWith({
      userId: "user-123",
      month: "2026-01",
      weekStartsOn: 1,
    });
    expect(deps.authService.verifyAccessToken).toHaveBeenCalledWith("test-token");
  });

  it("gets a single event", async () => {
    const deps = buildAppDependencies();
    deps.calendarEventService.getEventById.mockResolvedValue(sampleEvent);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/calendar-events/1",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe("1");
  });

  it("returns 404 when missing", async () => {
    const deps = buildAppDependencies();
    deps.calendarEventService.getEventById.mockResolvedValue(null);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/calendar-events/999",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Calendar event not found");
  });

  it("returns 404 when event exists but belongs to a different user (ownership check)", async () => {
    const deps = buildAppDependencies();
    deps.calendarEventService.getEventById.mockResolvedValue({
      ...sampleEvent,
      userId: "other-user-456",
    });
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/calendar-events/1",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Calendar event not found");
  });

  it("creates an event", async () => {
    const deps = buildAppDependencies();
    deps.calendarEventService.createEvent.mockResolvedValue(sampleEvent);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/calendar-events",
      headers: { Authorization: "Bearer test-token" },
      body: {
        userId: "spoofed-user",
        title: sampleEvent.title,
        start: sampleEvent.start,
        end: sampleEvent.end,
        amount: sampleEvent.amount,
        type: sampleEvent.type,
        color: sampleEvent.color,
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe("1");
    expect(deps.calendarEventService.createEvent).toHaveBeenCalledWith({
      userId: "user-123",
      title: sampleEvent.title,
      start: sampleEvent.start,
      end: sampleEvent.end,
      amount: sampleEvent.amount,
      type: sampleEvent.type,
      color: sampleEvent.color,
    });
  });

  it("updates an event", async () => {
    const deps = buildAppDependencies();
    deps.calendarEventService.getEventById.mockResolvedValue(sampleEvent);
    deps.calendarEventService.updateEvent.mockResolvedValue(sampleEvent);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/calendar-events/1",
      headers: { Authorization: "Bearer test-token" },
      body: { title: "Updated" },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe("Payday");
    expect(deps.calendarEventService.updateEvent).toHaveBeenCalledWith("1", { title: "Updated" });
  });

  it("returns 404 on update when missing", async () => {
    const deps = buildAppDependencies();
    deps.calendarEventService.getEventById.mockResolvedValue(null);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/calendar-events/999",
      headers: { Authorization: "Bearer test-token" },
      body: { title: "Updated" },
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Calendar event not found");
    expect(deps.calendarEventService.updateEvent).not.toHaveBeenCalled();
  });

  it("deletes an event", async () => {
    const deps = buildAppDependencies();
    deps.calendarEventService.getEventById.mockResolvedValue(sampleEvent);
    deps.calendarEventService.deleteEvent.mockResolvedValue(true);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "DELETE",
      url: "/api/v1/calendar-events/1",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(204);
  });

  it("returns 404 on delete when missing", async () => {
    const deps = buildAppDependencies();
    deps.calendarEventService.getEventById.mockResolvedValue(null);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "DELETE",
      url: "/api/v1/calendar-events/999",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Calendar event not found");
  });
});
