import { z } from "zod";
import { isParsableDate } from "../../utils/date.js";

const dateString = z
  .string()
  .refine(isParsableDate, "Date must be ISO 8601 or YYYY-MM-DD");

const eventType = z.enum(["debit", "credit"]);

export const calendarEventCreateSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(255),
  start: dateString,
  end: dateString.optional().nullable(),
  amount: z.number().finite(),
  type: eventType,
  color: z.string().max(32).optional().nullable()
});

export const calendarEventUpdateSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    start: dateString.optional(),
    end: dateString.optional().nullable(),
    amount: z.number().finite().optional(),
    type: eventType.optional(),
    color: z.string().max(32).optional().nullable()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const calendarEventQuerySchema = z.object({
  userId: z.string().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM")
});
