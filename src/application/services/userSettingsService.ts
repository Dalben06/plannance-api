import type {
  UserSettings,
  UserSettingsCreate,
  UserSettingsUpdate,
} from "../../domain/userSettings.js";
import type { UserSettingsRepository } from "../ports/userSettingsRepository.js";

export type UserSettingsService = {
  getByUserId(userId: string): Promise<UserSettings | null>;
  create(input: UserSettingsCreate): Promise<UserSettings>;
  update(userId: string, input: UserSettingsUpdate): Promise<UserSettings | null>;
};

export const createUserSettingsService = (
  repository: UserSettingsRepository
): UserSettingsService => ({
  getByUserId: (userId) => repository.findByUserId(userId),
  create: (input) => repository.create(input),
  update: (userId, input) => repository.update(userId, input),
});
