import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    env: {
      NODE_ENV: "test"
    },
    coverage: {
      provider: "v8",
      exclude: [
        // DI wiring and Express factory — structural glue with no standalone logic
        "src/app.ts",
        "src/container.ts",
        // Infrastructure — can't unit-test without a real DB connection
        "src/db/**",
        // Config — env-var parsing, not testable without process.env manipulation
        "src/config/**",
        // Domain types — pure TypeScript interfaces/types with no runtime behaviour
        "src/domain/auth.ts",
        "src/domain/user.ts",
        "src/domain/calendarEvent.ts",
        "src/domain/calendarDay.ts",
        // Test helpers — not production code
        "tests/**"
      ]
    }
  }
});
