import type {
  ForecastEvent,
  ForecastEventCreate,
  ForecastEventUpdate,
} from "../../domain/forecastEvent.js";

export interface ForecastEventRepository {
  listByUser(userId: string): Promise<ForecastEvent[]>;
  getByUuid(uuid: string, userId: string): Promise<ForecastEvent | null>;
  create(input: ForecastEventCreate): Promise<ForecastEvent>;
  update(uuid: string, userId: string, input: ForecastEventUpdate): Promise<ForecastEvent | null>;
  delete(uuid: string, userId: string): Promise<boolean>;
}
