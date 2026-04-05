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

const calendarEventType = z.enum(["debit", "credit"]);

const csvImportRowUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Title is required").max(255),
  start: dateString,
  amount: z.number().finite(),
  type: calendarEventType,
});

const csvImportErrorRowSchema = z.object({
  id: z.string().min(1),
  line: z.number(),
  title: z.string(),
  start: z.string(),
  amount: z.union([z.number(), z.string()]),
  type: calendarEventType.nullable(),
  errors: z.array(z.string()),
});

export const csvImportUpdateSchema = z.object({
  id: z.string().min(1, "id is required"),
  data: z.array(csvImportRowUpdateSchema),
  errorsLines: z.array(csvImportErrorRowSchema),
});
