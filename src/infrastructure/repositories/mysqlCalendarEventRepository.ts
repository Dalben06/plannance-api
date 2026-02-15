import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventFilters,
  CalendarEventUpdate
} from "../../domain/calendarEvent.js";
import type { CalendarEventRepository } from "../../application/ports/calendarEventRepository.js";
import { parseMonthRangeUtc, toIsoString, toMysqlDateTime } from "../../utils/date.js";

type CalendarEventRow = RowDataPacket & {
  id: number;
  user_id: string;
  title: string;
  start_at: Date;
  end_at: Date | null;
  amount: string | number;
  type: "debit" | "credit";
  color: string | null;
  created_at: Date;
  updated_at: Date;
};

const mapRow = (row: CalendarEventRow): CalendarEvent => ({
  id: row.id.toString(),
  userId: row.user_id,
  title: row.title,
  start: toIsoString(row.start_at) ?? new Date(row.start_at).toISOString(),
  end: toIsoString(row.end_at),
  amount: Number(row.amount),
  type: row.type,
  color: row.color ?? null,
  createdAt: toIsoString(row.created_at) ?? new Date(row.created_at).toISOString(),
  updatedAt: toIsoString(row.updated_at) ?? new Date(row.updated_at).toISOString()
});

export class MysqlCalendarEventRepository implements CalendarEventRepository {
  constructor(private readonly pool: Pool) {}

  async list(filters: CalendarEventFilters): Promise<CalendarEvent[]> {
    const conditions: string[] = [];
    const params: Array<string | number> = [];

    if (filters.userId) {
      conditions.push("user_id = ?");
      params.push(filters.userId);
    }

    if (filters.month) {
      const range = parseMonthRangeUtc(filters.month);
      if (range) {
        conditions.push("start_at >= ? AND start_at < ?");
        params.push(toMysqlDateTime(range.start));
        params.push(toMysqlDateTime(range.end));
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await this.pool.query<CalendarEventRow[]>(
      `SELECT * FROM calendar_events ${where} ORDER BY start_at ASC`,
      params
    );

    return rows.map(mapRow);
  }

  async getById(id: string): Promise<CalendarEvent | null> {
    const [rows] = await this.pool.query<CalendarEventRow[]>(
      "SELECT * FROM calendar_events WHERE id = ?",
      [id]
    );

    const row = rows[0];
    return row ? mapRow(row) : null;
  }

  async create(input: CalendarEventCreate): Promise<CalendarEvent> {
    const startAt = toMysqlDateTime(new Date(input.start));
    const endAt = input.end ? toMysqlDateTime(new Date(input.end)) : null;

    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO calendar_events
        (user_id, title, start_at, end_at, amount, type, color)
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      ,
      [
        input.userId,
        input.title,
        startAt,
        endAt,
        input.amount,
        input.type,
        input.color ?? null
      ]
    );

    const created = await this.getById(result.insertId.toString());
    if (!created) {
      throw new Error("Failed to fetch newly created calendar event");
    }

    return created;
  }

  async update(id: string, input: CalendarEventUpdate): Promise<CalendarEvent | null> {
    const updates: string[] = [];
    const params: Array<string | number | null> = [];

    if (input.title !== undefined) {
      updates.push("title = ?");
      params.push(input.title);
    }

    if (input.start !== undefined) {
      updates.push("start_at = ?");
      params.push(toMysqlDateTime(new Date(input.start)));
    }

    if (input.end !== undefined) {
      updates.push("end_at = ?");
      params.push(input.end ? toMysqlDateTime(new Date(input.end)) : null);
    }

    if (input.amount !== undefined) {
      updates.push("amount = ?");
      params.push(input.amount);
    }

    if (input.type !== undefined) {
      updates.push("type = ?");
      params.push(input.type);
    }

    if (input.color !== undefined) {
      updates.push("color = ?");
      params.push(input.color ?? null);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    params.push(id);

    await this.pool.query(
      `UPDATE calendar_events SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(
      "DELETE FROM calendar_events WHERE id = ?",
      [id]
    );

    return result.affectedRows > 0;
  }
}
