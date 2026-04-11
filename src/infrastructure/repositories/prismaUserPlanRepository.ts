import type { PrismaClient, UserPlan as PrismaUserPlan } from "@prisma/client";
import type { UserPlan, UserPlanCreate, UserPlanUpdate } from "../../domain/userPlan.js";
import type { UserPlanRepository } from "../../application/ports/userPlanRepository.js";
import { toIsoString } from "../../utils/date.js";

const mapRow = (row: PrismaUserPlan): UserPlan => ({
  id: row.id.toString(),
  userId: row.userId,
  budget: Number(row.budget),
  reminderImportRegister: row.reminderImportRegister,
  notifyFixedEventOnDay: row.notifyFixedEventOnDay,
  createdAt: toIsoString(row.createdAt) ?? row.createdAt.toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? row.updatedAt.toISOString(),
});

export class PrismaUserPlanRepository implements UserPlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByUserId(userId: string): Promise<UserPlan | null> {
    const row = await this.prisma.userPlan.findFirst({ where: { userId } });
    return row ? mapRow(row) : null;
  }

  async create(input: UserPlanCreate): Promise<UserPlan> {
    const row = await this.prisma.userPlan.create({
      data: {
        userId: input.userId,
        budget: input.budget,
        reminderImportRegister: input.reminderImportRegister,
        notifyFixedEventOnDay: input.notifyFixedEventOnDay,
      },
    });
    return mapRow(row);
  }

  async upsert(id: string, userId: string, input: UserPlanUpdate): Promise<UserPlan> {
    const existing = await this.prisma.userPlan.findFirst({
      where: { id: BigInt(id), userId },
    });

    if (existing) {
      const updated = await this.prisma.userPlan.update({
        where: { id: BigInt(id) },
        data: {
          budget: input.budget,
          reminderImportRegister: input.reminderImportRegister,
          notifyFixedEventOnDay: input.notifyFixedEventOnDay,
        },
      });
      return mapRow(updated);
    }

    const created = await this.prisma.userPlan.create({
      data: {
        userId,
        budget: input.budget,
        reminderImportRegister: input.reminderImportRegister,
        notifyFixedEventOnDay: input.notifyFixedEventOnDay,
      },
    });
    return mapRow(created);
  }
}
