import type { UserPlan, UserPlanCreate, UserPlanUpdate } from "../../domain/userPlan.js";
import type { UserPlanRepository } from "../ports/userPlanRepository.js";

export type UserPlanService = {
  getPlan(userId: string): Promise<UserPlan | null>;
  createPlan(input: UserPlanCreate): Promise<UserPlan>;
  upsertPlan(userId: string, input: UserPlanUpdate): Promise<UserPlan>;
};

export const createUserPlanService = (repository: UserPlanRepository): UserPlanService => ({
  getPlan: (userId) => repository.getByUserId(userId),
  createPlan: (input) => repository.create(input),
  upsertPlan: async (userId, input) => {
    const existing = await repository.getByUserId(userId);
    if (!existing) {
      return repository.create({ ...input, userId });
    }
    return repository.upsert(existing.id, userId, input);
  },
});
