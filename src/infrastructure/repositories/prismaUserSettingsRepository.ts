import type { PrismaClient, UserSettings as PrismaUserSettings } from "@prisma/client";
import type {
  UserSettings,
  UserSettingsCreate,
  UserSettingsUpdate,
} from "../../domain/userSettings.js";
import type { UserSettingsRepository } from "../../application/ports/userSettingsRepository.js";

const mapRow = (row: PrismaUserSettings): UserSettings => ({
  id: row.id.toString(),
  userId: row.userId,
  phoneNumber: row.phoneNumber,
  isDarkMode: row.isDarkMode,
  notifyByEmail: row.notifyByEmail,
  notifyByMessage: row.notifyByMessage,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

function isPrismaNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2025"
  );
}

export class PrismaUserSettingsRepository implements UserSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<UserSettings | null> {
    const row = await this.prisma.userSettings.findUnique({ where: { userId } });
    return row ? mapRow(row) : null;
  }

  async create(input: UserSettingsCreate): Promise<UserSettings> {
    const row = await this.prisma.userSettings.create({
      data: {
        userId: input.userId,
        phoneNumber: input.phoneNumber,
        isDarkMode: input.isDarkMode,
        notifyByEmail: input.notifyByEmail,
        notifyByMessage: input.notifyByMessage,
      },
    });
    return mapRow(row);
  }

  async update(userId: string, input: UserSettingsUpdate): Promise<UserSettings | null> {
    try {
      const row = await this.prisma.userSettings.update({
        where: { userId },
        data: {
          phoneNumber: input.phoneNumber,
          isDarkMode: input.isDarkMode,
          notifyByEmail: input.notifyByEmail,
          notifyByMessage: input.notifyByMessage,
        },
      });
      return mapRow(row);
    } catch (err: unknown) {
      if (isPrismaNotFoundError(err)) return null;
      throw err;
    }
  }
}
