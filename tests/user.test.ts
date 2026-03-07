import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { buildAppDependencies, sendRequest } from "./testUtils.js";
import type { UserView } from "../src/domain/user.js";

const sampleUserView: UserView = {
  id: "new-user-uuid",
  email: "new@example.com",
  name: "New User",
  picture: null,
};

describe("user routes", () => {
  it("creates a user with valid data", async () => {
    const deps = buildAppDependencies();
    deps.userService.create.mockResolvedValue(sampleUserView);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users",
      body: { name: "New User", email: "new@example.com", password: "securepassword" },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(sampleUserView);
    expect(deps.userService.create).toHaveBeenCalledWith({
      name: "New User",
      email: "new@example.com",
      picture: null,
      password: "securepassword",
    });
  });

  it("returns 400 when name is missing", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users",
      body: { email: "new@example.com", password: "securepassword" },
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid email", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users",
      body: { name: "New User", email: "not-an-email", password: "securepassword" },
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for a password shorter than 6 characters", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users",
      body: { name: "New User", email: "new@example.com", password: "123" },
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for a picture that is not a valid URL", async () => {
    const deps = buildAppDependencies();
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users",
      body: { name: "New User", email: "new@example.com", password: "securepassword", picture: "not-a-url" },
    });

    expect(response.status).toBe(400);
  });

  it("accepts a null picture", async () => {
    const deps = buildAppDependencies();
    deps.userService.create.mockResolvedValue(sampleUserView);
    const app = createApp(deps);

    const response = await sendRequest(app, {
      method: "POST",
      url: "/api/v1/users",
      body: { name: "New User", email: "new@example.com", password: "securepassword", picture: null },
    });

    expect(response.status).toBe(200);
    expect(deps.userService.create).toHaveBeenCalledWith(expect.objectContaining({ picture: null }));
  });
});
