import { createApp } from "../src/app.js";
import { buildAppDependencies, sendRequest } from "./testUtils.js";
import { describe, expect, it } from "vitest";

describe("health route", () => {
  it("returns ok", async () => {
    const app = createApp(buildAppDependencies());

    const response = await sendRequest(app, { method: "GET", url: "/api/v1/health" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.time).toBeDefined();
  });
});
