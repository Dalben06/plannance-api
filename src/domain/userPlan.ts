export type UserPlan = {
  id: string;
  userId: string;
  budget: number;
  reminderImportRegister: boolean;
  notifyFixedEventOnDay: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserPlanView = Omit<UserPlan, "id" | "userId" | "createdAt" | "updatedAt">;

export type UserPlanCreate = {
  userId: string;
  budget: number;
  reminderImportRegister: boolean;
  notifyFixedEventOnDay: boolean;
};

export type UserPlanCreateInput = Omit<UserPlanCreate, "userId">;

export type UserPlanUpdate = {
  budget: number;
  reminderImportRegister: boolean;
  notifyFixedEventOnDay: boolean;
};
