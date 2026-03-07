import type { PrismaClient, CalendarEvent as PrismaCalendarEvent, Prisma } from "@prisma/client";
import type {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventFilters,
  CalendarEventUpdate
} from "../../domain/calendarEvent.js";
import type { CalendarEventRepository } from "../../application/ports/calendarEventRepository.js";
import { parseMonthRangeUtc, toIsoString } from "../../utils/date.js";

const mapRow = (row: PrismaCalendarEvent): CalendarEvent => ({
  id: row.id.toString(),
  userId: row.userId,
  title: row.title,
  start: toIsoString(row.startAt) ?? row.startAt.toISOString(),
  end: toIsoString(row.endAt),
  amount: Number(row.amount),
  type: row.type,
  color: row.color ?? null,
  createdAt: toIsoString(row.createdAt) ?? row.createdAt.toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? row.updatedAt.toISOString()
});

export class PrismaCalendarEventRepository implements CalendarEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(filters: CalendarEventFilters): Promise<CalendarEvent[]> {
    const where: Prisma.CalendarEventWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.month) {
      const range = parseMonthRangeUtc(filters.month);
      if (range) {
        where.startAt = { gte: range.start, lt: range.end };
      }
    }
    const rows = await this.prisma.calendarEvent.findMany({
      where,
      orderBy: { startAt: "asc" }
    });

    return rows.map(mapRow);
  }

  async getById(id: string): Promise<CalendarEvent | null> {
    const row = await this.prisma.calendarEvent.findUnique({
      where: { id: BigInt(id) }
    });

    return row ? mapRow(row) : null;
  }

  async create(input: CalendarEventCreate): Promise<CalendarEvent> {
    const row = await this.prisma.calendarEvent.create({
      data: {
        userId: input.userId,
        title: input.title,
        startAt: new Date(input.start),
        endAt: input.end ? new Date(input.end) : null,
        amount: input.amount,
        type: input.type,
        color: input.color ?? null
      }
    });

    return mapRow(row);
  }

  async update(id: string, input: CalendarEventUpdate): Promise<CalendarEvent | null> {
    const data: Prisma.CalendarEventUpdateInput = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.start !== undefined) data.startAt = new Date(input.start);
    if (input.end !== undefined) data.endAt = input.end ? new Date(input.end) : null;
    if (input.amount !== undefined) data.amount = input.amount;
    if (input.type !== undefined) data.type = input.type;
    if (input.color !== undefined) data.color = input.color ?? null;

    if (Object.keys(data).length === 0) {
      return this.getById(id);
    }

    try {
      const row = await this.prisma.calendarEvent.update({
        where: { id: BigInt(id) },
        data
      });
      return mapRow(row);
    } catch (err: unknown) {
      if (isPrismaNotFoundError(err)) return null;
      throw err;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.calendarEvent.delete({
        where: { id: BigInt(id) }
      });
      return true;
    } catch (err: unknown) {
      if (isPrismaNotFoundError(err)) return false;
      throw err;
    }
  }
}

function isPrismaNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2025"
  );
}
