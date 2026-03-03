import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { buildAppDependencies, sampleAuthenticatedUser, sendRequest } from "./testUtils.js";

describe("auth routes", () => {
  it("authenticates with Google", async () => {
    const deps = buildAppDependencies();
    deps.authService.authenticateWithGoogle.mockResolvedValue({
      accessToken: "app-token",
      expiresIn: 3600,
      tokenType: "Bearer",
      user: sampleAuthenticatedUser
    });
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/auth/google",
      body: { idToken: "google-id-token" }
    });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBe("app-token");
    expect(deps.authService.authenticateWithGoogle).toHaveBeenCalledWith("google-id-token");
  });

  it("returns the authenticated user", async () => {
    const app = createApp(buildAppDependencies());

    const response = await sendRequest(app, {
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { Authorization: "Bearer test-token" }
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(sampleAuthenticatedUser);
  });
});
