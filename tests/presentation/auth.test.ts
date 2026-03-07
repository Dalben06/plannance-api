import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { buildAppDependencies, sampleAuthenticatedUser, sendRequest } from "../testUtils.js";

describe("auth routes", () => {
  it("authenticates with Google", async () => {
    const deps = buildAppDependencies();
    deps.authService.authenticate.mockResolvedValue({
      accessToken: "app-token",
      expiresIn: 3600,
      tokenType: "Bearer",
      user: sampleAuthenticatedUser,
    });
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/auth/login",
      body: { type: "google", tokenId: "google-id-token" },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBe("app-token");
    expect(deps.authService.authenticate).toHaveBeenCalledWith({
      type: "google",
      tokenId: "google-id-token",
    });
  });

  it("authenticates with email and password", async () => {
    const deps = buildAppDependencies();
    deps.authService.authenticate.mockResolvedValue({
      accessToken: "app-token",
      expiresIn: 3600,
      tokenType: "Bearer",
      user: sampleAuthenticatedUser,
    });
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/auth/login",
      body: { type: "email_password", username: "user@example.com", password: "secret" },
    });

    expect(response.status).toBe(200);
    expect(deps.authService.authenticate).toHaveBeenCalledWith({
      type: "email_password",
      username: "user@example.com",
      password: "secret",
    });
  });

  it("returns 400 for an invalid auth type", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/auth/login",
      body: { type: "unknown_provider", tokenId: "token" },
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 when google tokenId is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/auth/login",
      body: { type: "google" },
    });

    expect(response.status).toBe(400);
  });

  it("returns the authenticated user", async () => {
    const app = createApp(buildAppDependencies());

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { Authorization: "Bearer test-token" },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(sampleAuthenticatedUser);
  });
});
