import type { CalendarEventRepository } from "./application/ports/calendarEventRepository.js";
import type { GoogleIdentityProvider } from "./application/ports/googleIdentityProvider.js";
import type { SessionTokenService } from "./application/ports/sessionTokenService.js";
import { createAuthService, type AuthService } from "./application/services/authService.js";
import {
  createCalendarEventService,
  type CalendarEventService
} from "./application/services/calendarEventService.js";
import {
  createCalendarDayService,
  type CalendarDayService
} from "./application/services/calendarDayService.js";
import { env } from "./config/env.js";
import { getPool } from "./db/mysql.js";
import { GoogleTokenInfoIdentityProvider } from "./infrastructure/auth/googleTokenInfoIdentityProvider.js";
import { HmacSessionTokenService } from "./infrastructure/auth/hmacSessionTokenService.js";
import { MysqlCalendarEventRepository } from "./infrastructure/repositories/mysqlCalendarEventRepository.js";

export type AppContainer = {
  calendarEventService: CalendarEventService;
  calendarDaysService: CalendarDayService;
  authService: AuthService;
};

export type AppContainerOverrides = Partial<AppContainer> & {
  calendarEventRepository?: CalendarEventRepository;
  googleIdentityProvider?: GoogleIdentityProvider;
  sessionTokenService?: SessionTokenService;
};

export const createContainer = (
  overrides: AppContainerOverrides = {}
): AppContainer => {
  let calendarEventRepository = overrides.calendarEventRepository;
  let googleIdentityProvider = overrides.googleIdentityProvider;
  let sessionTokenService = overrides.sessionTokenService;

  const getCalendarEventRepository = (): CalendarEventRepository => {
    if (!calendarEventRepository) {
      calendarEventRepository = new MysqlCalendarEventRepository(getPool());
    }

    return calendarEventRepository;
  };

  const getGoogleIdentityProvider = (): GoogleIdentityProvider => {
    if (!googleIdentityProvider) {
      googleIdentityProvider = new GoogleTokenInfoIdentityProvider(env.GOOGLE_CLIENT_ID);
    }

    return googleIdentityProvider;
  };

  const getSessionTokenService = (): SessionTokenService => {
    if (!sessionTokenService) {
      sessionTokenService = new HmacSessionTokenService(
        env.AUTH_JWT_SECRET,
        env.AUTH_TOKEN_TTL_SECONDS
      );
    }

    return sessionTokenService;
  };

  const calendarEventService =
    overrides.calendarEventService ??
    createCalendarEventService(getCalendarEventRepository());

  const calendarDaysService =
    overrides.calendarDaysService ??
    createCalendarDayService(getCalendarEventRepository());

  const authService =
    overrides.authService ?? createAuthService(getGoogleIdentityProvider(), getSessionTokenService());

  return {
    calendarEventService,
    calendarDaysService,
    authService
  };
};
