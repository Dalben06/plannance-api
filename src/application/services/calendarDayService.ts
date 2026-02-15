import { CalendarDay } from "../../domain/calendarDay.js";
import {
    CalendarEventFilters,
    CalendarWeekStartsOn,
} from "../../domain/calendarEvent.js";
import { addDays, parseMonthRangeUtc, startOfMonth, startOfWeek } from "../../utils/date.js";
import { CalendarEventRepository } from "../ports/calendarEventRepository.js";

export type CalendarDayService = {
    listMonthSummary(filters: CalendarEventFilters): Promise<CalendarDay[]>;
};

export const createCalendarDayService = (
    eventRepository: CalendarEventRepository
): CalendarDayService => {
    const listOfMonthDays = (
        date: string,
        startsOn: CalendarWeekStartsOn
    ): CalendarDay[] => {
        const range = parseMonthRangeUtc(date)
        if (!range?.start) return [];

        const gridStart = startOfWeek(range?.start, startsOn);

        return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)).map(
            (d) => ({
                date: d,
                events: [],
                expense: 0,
                income: 0,
            })
        );
    };

    const dayKey = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")}`;

    return {
        listMonthSummary: async (filters) => {
            if (!filters.month) throw new Error("Month is required!");

            const startsOn = filters.weekStartsOn; // if optional, set a default here
            if (startsOn == null) throw new Error("weekStartsOn is required!");

            const monthDays = listOfMonthDays(filters.month, startsOn);

            const events = await eventRepository.list(filters);

            if (!events.length) return monthDays;

            const byDay = new Map<string, CalendarDay>();
            monthDays.forEach((d) => byDay.set(dayKey(d.date), d));

            for (const ev of events) {
                if(!ev.start) continue;

                const evDate = new Date(ev.start);
                if (!evDate) continue;

                const day = byDay.get(dayKey(evDate));
                if (!day) continue;

                day.events.push(ev);
                day[ev.type === 'debit' ? 'expense' : 'income'] += ev.amount;
            }

            return monthDays;
        },
    };
};
