export const isParsableDate = (value: string): boolean => !Number.isNaN(Date.parse(value));

export const parseMonthRangeUtc = (
  month: string
): { start: Date; end: Date } | null => {
  const match = /^\d{4}-\d{2}$/.exec(month);
  if (!match) return null;
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1; // 0-11
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return null;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));
  return { start, end };
};

const pad = (value: number): string => value.toString().padStart(2, "0");

export const toMysqlDateTime = (date: Date): string => {
  return [
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  ].join(" ");
};

export const toIsoString = (value: Date | string | null): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return parsed.toISOString();
};

export function atNoon(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}
export function makeDate(y: number, m: number, day: number) {
  return new Date(y, m, day, 12, 0, 0, 0);
}
export function addDays(d: Date, days: number) {
  const x = atNoon(d);
  x.setDate(x.getDate() + days);
  return x;
}
export function startOfMonth(d: Date) {
  return makeDate(d.getFullYear(), d.getMonth(), 1);
}
export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
export function startOfWeek(d: Date, weekStartsOn: 0 | 1) {
  const x = atNoon(d);
  const dow = x.getDay();
  const diff = (dow - weekStartsOn + 7) % 7;
  return addDays(x, -diff);
}
