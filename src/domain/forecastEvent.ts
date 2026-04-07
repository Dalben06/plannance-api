export type ForecastEventType = "debit" | "credit";

export type ForecastEvent = {
  id: string; // uuid
  userId: string;
  name: string;
  day: number;
  amount: number;
  type: ForecastEventType;
  startDate: string; // ISO date
  endDate: string | null; // ISO date or null
  createdAt: string;
  updatedAt: string;
};

export type ForecastEventCreate = {
  userId: string;
  uuid: string;
  name: string;
  day: number;
  amount: number;
  type: ForecastEventType;
  startDate: string;
  endDate: string | null;
};

export type ForecastEventCreateInput = {
  name: string;
  day: number;
  amount: number;
  type: ForecastEventType;
  startDate: string;
  endDate?: string | null;
};

export type ForecastEventUpdate = Partial<{
  name: string;
  day: number;
  amount: number;
  type: ForecastEventType;
  startDate: string;
  endDate: string | null;
}>;
