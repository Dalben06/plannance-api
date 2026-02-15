import { CalendarEvent } from "./calendarEvent.js";

export type CalendarDay = {
    date: Date,
    events: CalendarEvent[],
    expense: number,
    income: number,
}