import type { UserPlan, UserPlanCreate, UserPlanUpdate } from "../../domain/userPlan.js";

export interface UserPlanRepository {
  getByUserId(userId: string): Promise<UserPlan | null>;
  create(input: UserPlanCreate): Promise<UserPlan>;
  upsert(id: string, userId: string, input: UserPlanUpdate): Promise<UserPlan>;
}
