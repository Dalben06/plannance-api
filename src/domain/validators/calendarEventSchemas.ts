import { z } from "zod";
import { isParsableDate } from "../../utils/date.js";

const dateString = z.string().refine(isParsableDate, "Date must be ISO 8601 or YYYY-MM-DD");

const eventType = z.enum(["debit", "credit"]);
const monthString = z.string().regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM");
const weekStartsOn = z.coerce
  .number()
  .int()
  .refine((value) => value === 0 || value === 1, "weekStartsOn must be 0 or 1");

export const calendarEventCreateSchema = z.object({
  title: z.string().min(1).max(255),
  start: dateString,
  amount: z.number().finite(),
  type: eventType,
});

export const calendarEventUpdateSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    start: dateString.optional(),
    amount: z.number().finite().optional(),
    type: eventType.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const calendarEventQuerySchema = z.object({
  month: monthString.optional(),
  weekStartsOn: weekStartsOn.default(0),
});

export const calendarDayQuerySchema = z.object({
  month: monthString,
  weekStartsOn: weekStartsOn.default(0),
});
