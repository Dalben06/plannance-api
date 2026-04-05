import { z } from "zod";
import { isParsableDate } from "../../utils/date.js";

const dateString = z.string().refine(isParsableDate, "Date must be ISO 8601 or YYYY-MM-DD");
const amountString = z
  .string()
  .trim()
  .min(1, "Amount is required")
  .refine((value) => Number.isFinite(Number(value)), "Amount must be a finite number")
  .transform((value) => Number(value));

export const csvImportRowSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  startAt: dateString,
  amount: amountString,
});
