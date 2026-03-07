import type { CalendarEventRepository } from "./application/ports/calendarEventRepository.js";
import type { GoogleIdentityProvider } from "./application/ports/googleIdentityProvider.js";
import type { SessionTokenService } from "./application/ports/sessionTokenService.js";
import type { PasswordHasher } from "./application/ports/passwordHasher.js";
import type { UserRepository } from "./application/ports/userRepository.js";
import { createAuthService, type AuthService } from "./application/services/authService.js";
import {
  createCalendarEventService,
  type CalendarEventService,
} from "./application/services/calendarEventService.js";
import {
  createCalendarDayService,
  type CalendarDayService,
} from "./application/services/calendarDayService.js";
import { createUserService, type UserService } from "./application/services/userService.js";
import { env } from "./config/env.js";
import { getPrismaClient } from "./db/prisma.js";
import { GoogleTokenInfoIdentityProvider } from "./infrastructure/auth/googleTokenInfoIdentityProvider.js";
import { HmacSessionTokenService } from "./infrastructure/auth/hmacSessionTokenService.js";
import { BcryptPasswordHasher } from "./infrastructure/auth/bcryptPasswordHasher.js";
import { PrismaCalendarEventRepository } from "./infrastructure/repositories/prismaCalendarEventRepository.js";
import { PrismaUserRepository } from "./infrastructure/repositories/prismaUserRepository.js";

export type AppContainer = {
  calendarEventService: CalendarEventService;
  calendarDaysService: CalendarDayService;
  authService: AuthService;
  userService: UserService;
};

export type AppContainerOverrides = Partial<AppContainer> & {
  calendarEventRepository?: CalendarEventRepository;
  googleIdentityProvider?: GoogleIdentityProvider;
  sessionTokenService?: SessionTokenService;
  passwordHasher?: PasswordHasher;
  userRepository?: UserRepository;
};

export const createContainer = (overrides: AppContainerOverrides = {}): AppContainer => {
  let calendarEventRepository = overrides.calendarEventRepository;
  let userRepository = overrides.userRepository;
  let googleIdentityProvider = overrides.googleIdentityProvider;
  let sessionTokenService = overrides.sessionTokenService;
  let passwordHasher = overrides.passwordHasher;

  const getCalendarEventRepository = (): CalendarEventRepository => {
    if (!calendarEventRepository) {
      calendarEventRepository = new PrismaCalendarEventRepository(getPrismaClient());
    }
    return calendarEventRepository;
  };

  const getUserRepository = (): UserRepository => {
    if (!userRepository) {
      userRepository = new PrismaUserRepository(getPrismaClient());
    }
    return userRepository;
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

  const getPasswordHasher = (): PasswordHasher => {
    if (!passwordHasher) {
      passwordHasher = new BcryptPasswordHasher();
    }
    return passwordHasher;
  };

  const calendarEventService =
    overrides.calendarEventService ?? createCalendarEventService(getCalendarEventRepository());

  const calendarDaysService =
    overrides.calendarDaysService ?? createCalendarDayService(getCalendarEventRepository());

  const authService =
    overrides.authService ??
    createAuthService(
      getGoogleIdentityProvider(),
      getSessionTokenService(),
      getUserRepository(),
      getPasswordHasher()
    );

  const userService =
    overrides.userService ?? createUserService(getUserRepository(), getPasswordHasher());

  return {
    calendarEventService,
    calendarDaysService,
    authService,
    userService,
  };
};
