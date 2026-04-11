import type {
  UserSettings,
  UserSettingsCreate,
  UserSettingsUpdate,
} from "../../domain/userSettings.js";

export interface UserSettingsRepository {
  findByUserId(userId: string): Promise<UserSettings | null>;
  create(input: UserSettingsCreate): Promise<UserSettings>;
  update(userId: string, input: UserSettingsUpdate): Promise<UserSettings | null>;
}
