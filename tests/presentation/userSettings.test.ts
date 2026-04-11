import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { buildAppDependencies, sendRequest, sampleAuthenticatedUser } from "../testUtils.js";
import type { UserSettingsView } from "../../src/domain/userSettings.js";

const sampleSettingsView: UserSettingsView = {
  phoneNumber: "+1234567890",
  isDarkMode: true,
  notifyByEmail: false,
  notifyByMessage: false,
};

const validCreateBody = {
  phoneNumber: "+1234567890",
  isDarkMode: true,
  notifyByEmail: false,
  notifyByMessage: false,
};

const validUpdateBody = {
  phoneNumber: "+1234567890",
  isDarkMode: false,
  notifyByEmail: true,
  notifyByMessage: false,
};

describe("user settings routes", () => {
  describe("GET /api/v1/users/settings", () => {
    it("returns 401 when no auth token is provided", async () => {
      const deps = buildAppDependencies();
      deps.authService.verifyAccessToken.mockReturnValue(null);
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "GET",
        url: "/api/v1/users/settings",
      });

      expect(response.status).toBe(401);
    });

    it("returns 200 with settings when they exist", async () => {
      const deps = buildAppDependencies();
      deps.userSettingsService.getByUserId.mockResolvedValue({
        id: "1",
        userId: sampleAuthenticatedUser.id,
        ...sampleSettingsView,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "GET",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: sampleSettingsView });
      expect(deps.userSettingsService.getByUserId).toHaveBeenCalledWith(sampleAuthenticatedUser.id);
    });

    it("returns 404 when settings do not exist", async () => {
      const deps = buildAppDependencies();
      deps.userSettingsService.getByUserId.mockResolvedValue(null);
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "GET",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
      });

      expect(response.status).toBe(404);
    });

    it("returns 500 when service throws an unexpected error", async () => {
      const deps = buildAppDependencies();
      deps.userSettingsService.getByUserId.mockRejectedValue(new Error("DB failure"));
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "GET",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
      });

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/v1/users/settings", () => {
    it("returns 401 when no auth token is provided", async () => {
      const deps = buildAppDependencies();
      deps.authService.verifyAccessToken.mockReturnValue(null);
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "POST",
        url: "/api/v1/users/settings",
        body: validCreateBody,
      });

      expect(response.status).toBe(401);
    });

    it("returns 201 with created settings", async () => {
      const deps = buildAppDependencies();
      deps.userSettingsService.getByUserId.mockResolvedValue(null);
      deps.userSettingsService.create.mockResolvedValue({
        id: "1",
        userId: sampleAuthenticatedUser.id,
        ...sampleSettingsView,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "POST",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: validCreateBody,
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ data: sampleSettingsView });
      expect(deps.userSettingsService.create).toHaveBeenCalledWith({
        userId: sampleAuthenticatedUser.id,
        phoneNumber: validCreateBody.phoneNumber,
        isDarkMode: validCreateBody.isDarkMode,
        notifyByEmail: validCreateBody.notifyByEmail,
        notifyByMessage: validCreateBody.notifyByMessage,
      });
    });

    it("returns 409 when settings already exist", async () => {
      const deps = buildAppDependencies();
      deps.userSettingsService.getByUserId.mockResolvedValue({
        id: "1",
        userId: sampleAuthenticatedUser.id,
        ...sampleSettingsView,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "POST",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: validCreateBody,
      });

      expect(response.status).toBe(409);
    });

    it("returns 400 when phoneNumber is missing", async () => {
      const deps = buildAppDependencies();
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "POST",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: { isDarkMode: true, notifyByEmail: false, notifyByMessage: false },
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when isDarkMode is missing", async () => {
      const deps = buildAppDependencies();
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "POST",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: { phoneNumber: "+1234567890", notifyByEmail: false, notifyByMessage: false },
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when notifyByEmail is missing", async () => {
      const deps = buildAppDependencies();
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "POST",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: { phoneNumber: "+1234567890", isDarkMode: true, notifyByMessage: false },
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when notifyByMessage is missing", async () => {
      const deps = buildAppDependencies();
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "POST",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: { phoneNumber: "+1234567890", isDarkMode: true, notifyByEmail: false },
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when isDarkMode is not a boolean", async () => {
      const deps = buildAppDependencies();
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "POST",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: {
          phoneNumber: "+1234567890",
          isDarkMode: "yes",
          notifyByEmail: false,
          notifyByMessage: false,
        },
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when notifyByEmail is not a boolean", async () => {
      const deps = buildAppDependencies();
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "POST",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: {
          phoneNumber: "+1234567890",
          isDarkMode: true,
          notifyByEmail: "yes",
          notifyByMessage: false,
        },
      });

      expect(response.status).toBe(400);
    });

    it("returns 500 when service throws an unexpected error", async () => {
      const deps = buildAppDependencies();
      deps.userSettingsService.getByUserId.mockResolvedValue(null);
      deps.userSettingsService.create.mockRejectedValue(new Error("DB failure"));
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "POST",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: validCreateBody,
      });

      expect(response.status).toBe(500);
    });
  });

  describe("PUT /api/v1/users/settings", () => {
    it("returns 401 when no auth token is provided", async () => {
      const deps = buildAppDependencies();
      deps.authService.verifyAccessToken.mockReturnValue(null);
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "PUT",
        url: "/api/v1/users/settings",
        body: validUpdateBody,
      });

      expect(response.status).toBe(401);
    });

    it("returns 200 with updated settings", async () => {
      const updatedView: UserSettingsView = {
        phoneNumber: "+1234567890",
        isDarkMode: false,
        notifyByEmail: true,
        notifyByMessage: false,
      };
      const deps = buildAppDependencies();
      deps.userSettingsService.update.mockResolvedValue({
        id: "1",
        userId: sampleAuthenticatedUser.id,
        ...updatedView,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "PUT",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: validUpdateBody,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: updatedView });
      expect(deps.userSettingsService.update).toHaveBeenCalledWith(
        sampleAuthenticatedUser.id,
        validUpdateBody
      );
    });

    it("returns 404 when settings do not exist", async () => {
      const deps = buildAppDependencies();
      deps.userSettingsService.update.mockResolvedValue(null);
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "PUT",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: validUpdateBody,
      });

      expect(response.status).toBe(404);
    });

    it("returns 400 when phoneNumber is missing", async () => {
      const deps = buildAppDependencies();
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "PUT",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: { isDarkMode: false, notifyByEmail: true, notifyByMessage: false },
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when notifyByEmail is missing", async () => {
      const deps = buildAppDependencies();
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "PUT",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: { phoneNumber: "+1234567890", isDarkMode: false, notifyByMessage: false },
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when notifyByMessage is missing", async () => {
      const deps = buildAppDependencies();
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "PUT",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: { phoneNumber: "+1234567890", isDarkMode: false, notifyByEmail: true },
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when notifyByEmail is not a boolean", async () => {
      const deps = buildAppDependencies();
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "PUT",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: {
          phoneNumber: "+1234567890",
          isDarkMode: false,
          notifyByEmail: "yes",
          notifyByMessage: false,
        },
      });

      expect(response.status).toBe(400);
    });

    it("returns 500 when service throws an unexpected error", async () => {
      const deps = buildAppDependencies();
      deps.userSettingsService.update.mockRejectedValue(new Error("DB failure"));
      const app = createApp(deps);

      const response = await sendRequest(app, {
        method: "PUT",
        url: "/api/v1/users/settings",
        headers: { authorization: "Bearer token" },
        body: validUpdateBody,
      });

      expect(response.status).toBe(500);
    });
  });
});
