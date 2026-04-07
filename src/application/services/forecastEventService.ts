import { randomUUID } from "node:crypto";
import type {
  ForecastEvent,
  ForecastEventCreateInput,
  ForecastEventUpdate,
} from "../../domain/forecastEvent.js";
import type { ForecastEventRepository } from "../ports/forecastEventRepository.js";

export type ForecastEventService = {
  listForecasts(userId: string): Promise<ForecastEvent[]>;
  getForecastById(uuid: string, userId: string): Promise<ForecastEvent | null>;
  createForecast(userId: string, input: ForecastEventCreateInput): Promise<ForecastEvent>;
  updateForecast(
    uuid: string,
    userId: string,
    input: ForecastEventUpdate
  ): Promise<ForecastEvent | null>;
  deleteForecast(uuid: string, userId: string): Promise<boolean>;
};

export const createForecastEventService = (
  repository: ForecastEventRepository,
  uuidGenerator: () => string = randomUUID
): ForecastEventService => ({
  listForecasts: (userId) => repository.listByUser(userId),
  getForecastById: (uuid, userId) => repository.getByUuid(uuid, userId),
  createForecast: (userId, input) =>
    repository.create({
      userId,
      uuid: uuidGenerator(),
      name: input.name,
      day: input.day,
      amount: input.amount,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
    }),
  updateForecast: (uuid, userId, input) => repository.update(uuid, userId, input),
  deleteForecast: (uuid, userId) => repository.delete(uuid, userId),
});
