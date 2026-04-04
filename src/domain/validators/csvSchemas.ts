import { z } from "zod";
import { calendarEventFields } from "../csv.js";

export const saveCsvMappingSchema = z.object({
  name: z.string().min(1),
  mappings: z.array(z.object({ from: z.string().min(1), to: z.enum(calendarEventFields) })).min(1),
});
