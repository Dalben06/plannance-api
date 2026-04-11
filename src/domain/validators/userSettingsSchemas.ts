import { z } from "zod";

export const createUserSettingsSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required").max(32),
  isDarkMode: z.boolean(),
  notifyByEmail: z.boolean(),
  notifyByMessage: z.boolean(),
});

export const updateUserSettingsSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required").max(32),
  isDarkMode: z.boolean(),
  notifyByEmail: z.boolean(),
  notifyByMessage: z.boolean(),
});
