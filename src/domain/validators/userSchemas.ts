import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  picture: z.string().url("Invalid URL").nullish().transform((v) => v ?? null),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});
