import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_CONNECTION_LIMIT: z.coerce.number().default(10)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => {
    const path = issue.path.join(".") || "env";
    return `${path}: ${issue.message}`;
  });
  throw new Error(`Invalid environment variables:\n${issues.join("\n")}`);
}

export const env = parsed.data;
