import { z } from "zod";

export const userPlanBodySchema = z.object({
  budget: z.number().finite().min(0),
  reminderImportRegister: z.boolean(),
  notifyFixedEventOnDay: z.boolean(),
});
