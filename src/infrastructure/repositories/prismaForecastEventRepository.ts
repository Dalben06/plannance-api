import type { PrismaClient, ForecastEvent as PrismaForecastEvent, Prisma } from "@prisma/client";
import type {
  ForecastEvent,
  ForecastEventCreate,
  ForecastEventUpdate,
} from "../../domain/forecastEvent.js";
import type { ForecastEventRepository } from "../../application/ports/forecastEventRepository.js";
import { toIsoString } from "../../utils/date.js";

const mapRow = (row: PrismaForecastEvent): ForecastEvent => ({
  id: row.uuid,
  userId: row.userId,
  name: row.name,
  day: row.day,
  amount: Number(row.amount),
  type: row.type,
  startDate: toIsoString(row.startDate) ?? row.startDate.toISOString(),
  endDate: toIsoString(row.endDate),
  createdAt: toIsoString(row.createdAt) ?? row.createdAt.toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? row.updatedAt.toISOString(),
});

export class PrismaForecastEventRepository implements ForecastEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByUser(userId: string): Promise<ForecastEvent[]> {
    const rows = await this.prisma.forecastEvent.findMany({
      where: { userId },
      orderBy: { day: "asc" },
    });
    return rows.map(mapRow);
  }

  async getByUuid(uuid: string, userId: string): Promise<ForecastEvent | null> {
    const row = await this.prisma.forecastEvent.findFirst({
      where: { uuid, userId },
    });
    return row ? mapRow(row) : null;
  }

  async create(input: ForecastEventCreate): Promise<ForecastEvent> {
    const row = await this.prisma.forecastEvent.create({
      data: {
        uuid: input.uuid,
        userId: input.userId,
        name: input.name,
        day: input.day,
        amount: input.amount,
        type: input.type,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
      },
    });
    return mapRow(row);
  }

  async update(
    uuid: string,
    userId: string,
    input: ForecastEventUpdate
  ): Promise<ForecastEvent | null> {
    const data: Prisma.ForecastEventUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.day !== undefined) data.day = input.day;
    if (input.amount !== undefined) data.amount = input.amount;
    if (input.type !== undefined) data.type = input.type;
    if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) {
      data.endDate = input.endDate ? new Date(input.endDate) : null;
    }

    if (Object.keys(data).length === 0) {
      return this.getByUuid(uuid, userId);
    }

    const result = await this.prisma.forecastEvent.updateMany({
      where: { uuid, userId },
      data,
    });

    if (result.count === 0) return null;
    return this.getByUuid(uuid, userId);
  }

  async delete(uuid: string, userId: string): Promise<boolean> {
    const result = await this.prisma.forecastEvent.deleteMany({
      where: { uuid, userId },
    });
    return result.count > 0;
  }
}
