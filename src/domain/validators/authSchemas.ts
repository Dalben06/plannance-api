import { z } from "zod";

export const authFormSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("google"),
    tokenId: z.string().min(1, "token is required"),
  }),
  z.object({
    type: z.literal("email_password"),
    username: z.string().min(1, "username is required"),
    password: z.string().min(1, "password is required"),
  }),
]);
