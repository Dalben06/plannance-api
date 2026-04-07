import { z } from "zod";
import { isParsableDate } from "../../utils/date.js";

const dateString = z.string().refine(isParsableDate, "Date must be ISO 8601 or YYYY-MM-DD");
const eventType = z.enum(["debit", "credit"]);

let cachedStartOfTodayUtc: Date | null = null;
let cachedStartOfTodayUtcTimestamp: number | null = null;

const startOfTodayUtc = (): Date => {
  const now = new Date();
  const nowTimestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (cachedStartOfTodayUtcTimestamp !== nowTimestamp) {
    cachedStartOfTodayUtc = new Date(nowTimestamp);
    cachedStartOfTodayUtcTimestamp = nowTimestamp;
  }
  return cachedStartOfTodayUtc!;
};

const baseShape = {
  name: z.string().min(1).max(255),
  day: z.number().int().min(1).max(31),
  amount: z.number().positive(),
  type: eventType,
  startDate: dateString,
  endDate: dateString.nullable().optional(),
};

export const forecastEventCreateSchema = z
  .object(baseShape)
  .refine((value) => new Date(value.startDate).getTime() <= startOfTodayUtc().getTime(), {
    path: ["startDate"],
    message: "startDate cannot be in the future",
  })
  .refine(
    (value) =>
      value.endDate == null ||
      new Date(value.endDate).getTime() > new Date(value.startDate).getTime(),
    {
      path: ["endDate"],
      message: "endDate must be greater than startDate",
    }
  );

export const forecastEventUpdateSchema = z
  .object({
    name: baseShape.name.optional(),
    day: baseShape.day.optional(),
    amount: baseShape.amount.optional(),
    type: baseShape.type.optional(),
    startDate: baseShape.startDate.optional(),
    endDate: baseShape.endDate,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  })
  .refine(
    (value) =>
      value.startDate === undefined ||
      new Date(value.startDate).getTime() <= startOfTodayUtc().getTime(),
    {
      path: ["startDate"],
      message: "startDate cannot be in the future",
    }
  )
  .refine(
    (value) =>
      value.startDate === undefined ||
      value.endDate == null ||
      new Date(value.endDate).getTime() > new Date(value.startDate).getTime(),
    {
      path: ["endDate"],
      message: "endDate must be greater than startDate",
    }
  );
