import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { buildAppDependencies, sendRequest, sampleAuthenticatedUser } from "../testUtils.js";

const samplePlan = {
  id: "1",
  userId: sampleAuthenticatedUser.id,
  budget: 1500,
  reminderImportRegister: true,
  notifyFixedEventOnDay: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const sampleView = {
  budget: 1500,
  reminderImportRegister: true,
  notifyFixedEventOnDay: false,
};

const validBody = {
  budget: 1500,
  reminderImportRegister: true,
  notifyFixedEventOnDay: false,
};

describe("user plan routes", () => {
  // ─── Auth guard ────────────────────────────────────────────────────────────

  it("GET /users/plan requires authentication", async () => {
    const deps = buildAppDependencies();
    deps.authService.verifyAccessToken.mockImplementation(() => {
      throw new Error("Authentication required");
    });
    const app = createApp(deps);
    const response = await sendRequest(app, { method: "GET", url: "/api/v1/users/plan" });
    expect(response.status).toBe(401);
    expect(deps.userPlanService.getPlan).not.toHaveBeenCalled();
  });

  it("POST /users/plan requires authentication", async () => {
    const deps = buildAppDependencies();
    deps.authService.verifyAccessToken.mockImplementation(() => {
      throw new Error("Authentication required");
    });
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users/plan",
      body: validBody,
    });
    expect(response.status).toBe(401);
    expect(deps.userPlanService.createPlan).not.toHaveBeenCalled();
  });

  it("PUT /users/plan requires authentication", async () => {
    const deps = buildAppDependencies();
    deps.authService.verifyAccessToken.mockImplementation(() => {
      throw new Error("Authentication required");
    });
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/users/plan",
      body: validBody,
    });
    expect(response.status).toBe(401);
    expect(deps.userPlanService.upsertPlan).not.toHaveBeenCalled();
  });

  // ─── GET /users/plan ────────────────────────────────────────────────────────

  it("GET returns 200 with plan data", async () => {
    const deps = buildAppDependencies();
    deps.userPlanService.getPlan.mockResolvedValue(samplePlan);
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: sampleView });
    expect(deps.userPlanService.getPlan).toHaveBeenCalledWith(sampleAuthenticatedUser.id);
  });

  it("GET returns 404 when no plan exists", async () => {
    const deps = buildAppDependencies();
    deps.userPlanService.getPlan.mockResolvedValue(null);
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
    });
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ error: "User plan not found" });
  });

  it("GET returns 500 when service throws", async () => {
    const deps = buildAppDependencies();
    deps.userPlanService.getPlan.mockRejectedValue(new Error("DB error"));
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
    });
    expect(response.status).toBe(500);
  });

  // ─── POST /users/plan ───────────────────────────────────────────────────────

  it("POST returns 201 with created plan", async () => {
    const deps = buildAppDependencies();
    deps.userPlanService.createPlan.mockResolvedValue(samplePlan);
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: validBody,
    });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: sampleView });
    expect(deps.userPlanService.createPlan).toHaveBeenCalledWith({
      ...validBody,
      userId: sampleAuthenticatedUser.id,
    });
  });

  it("POST fills userId from auth token, not from body", async () => {
    const deps = buildAppDependencies();
    deps.userPlanService.createPlan.mockResolvedValue(samplePlan);
    const app = createApp(deps);
    await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: { ...validBody, userId: "spoofed-user-id" },
    });
    expect(deps.userPlanService.createPlan).toHaveBeenCalledWith({
      budget: validBody.budget,
      reminderImportRegister: validBody.reminderImportRegister,
      notifyFixedEventOnDay: validBody.notifyFixedEventOnDay,
      userId: sampleAuthenticatedUser.id,
    });
  });

  it("POST returns 400 when budget is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: { reminderImportRegister: true, notifyFixedEventOnDay: false },
    });
    expect(response.status).toBe(400);
    expect(deps.userPlanService.createPlan).not.toHaveBeenCalled();
  });

  it("POST returns 400 when budget is negative", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: { budget: -1, reminderImportRegister: true, notifyFixedEventOnDay: false },
    });
    expect(response.status).toBe(400);
    expect(deps.userPlanService.createPlan).not.toHaveBeenCalled();
  });

  it("POST accepts budget of 0", async () => {
    const deps = buildAppDependencies();
    deps.userPlanService.createPlan.mockResolvedValue({ ...samplePlan, budget: 0 });
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: { budget: 0, reminderImportRegister: true, notifyFixedEventOnDay: false },
    });
    expect(response.status).toBe(201);
  });

  it("POST returns 400 when reminderImportRegister is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: { budget: 1000, notifyFixedEventOnDay: false },
    });
    expect(response.status).toBe(400);
  });

  it("POST returns 400 when notifyFixedEventOnDay is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: { budget: 1000, reminderImportRegister: true },
    });
    expect(response.status).toBe(400);
  });

  it("POST returns 500 when service throws", async () => {
    const deps = buildAppDependencies();
    deps.userPlanService.createPlan.mockRejectedValue(new Error("DB error"));
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: validBody,
    });
    expect(response.status).toBe(500);
  });

  // ─── PUT /users/plan ────────────────────────────────────────────────────────

  it("PUT returns 200 with updated plan", async () => {
    const deps = buildAppDependencies();
    const updatedPlan = { ...samplePlan, budget: 2000 };
    deps.userPlanService.upsertPlan.mockResolvedValue(updatedPlan);
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: { ...validBody, budget: 2000 },
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { ...sampleView, budget: 2000 } });
    expect(deps.userPlanService.upsertPlan).toHaveBeenCalledWith(sampleAuthenticatedUser.id, {
      budget: 2000,
      reminderImportRegister: true,
      notifyFixedEventOnDay: false,
    });
  });

  it("PUT fills userId from auth token, not from body", async () => {
    const deps = buildAppDependencies();
    deps.userPlanService.upsertPlan.mockResolvedValue(samplePlan);
    const app = createApp(deps);
    await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: { ...validBody, userId: "spoofed-user-id" },
    });
    expect(deps.userPlanService.upsertPlan).toHaveBeenCalledWith(sampleAuthenticatedUser.id, {
      budget: validBody.budget,
      reminderImportRegister: validBody.reminderImportRegister,
      notifyFixedEventOnDay: validBody.notifyFixedEventOnDay,
    });
  });

  it("PUT returns 400 when budget is negative", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: { budget: -100, reminderImportRegister: true, notifyFixedEventOnDay: false },
    });
    expect(response.status).toBe(400);
    expect(deps.userPlanService.upsertPlan).not.toHaveBeenCalled();
  });

  it("PUT returns 400 when body is invalid", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: { budget: "not-a-number", reminderImportRegister: true, notifyFixedEventOnDay: false },
    });
    expect(response.status).toBe(400);
    expect(deps.userPlanService.upsertPlan).not.toHaveBeenCalled();
  });

  it("PUT returns 500 when service throws", async () => {
    const deps = buildAppDependencies();
    deps.userPlanService.upsertPlan.mockRejectedValue(new Error("DB error"));
    const app = createApp(deps);
    const response = await sendRequest(app, {
      method: "PUT",
      url: "/api/v1/users/plan",
      headers: { Authorization: "Bearer test-token" },
      body: validBody,
    });
    expect(response.status).toBe(500);
  });
});
