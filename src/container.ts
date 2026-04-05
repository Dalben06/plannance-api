import type { CalendarEventRepository } from "./application/ports/calendarEventRepository.js";
import type { GoogleIdentityProvider } from "./application/ports/googleIdentityProvider.js";
import type { SessionTokenService } from "./application/ports/sessionTokenService.js";
import type { PasswordHasher } from "./application/ports/passwordHasher.js";
import type { UserRepository } from "./application/ports/userRepository.js";
import type { UserDocumentRepository } from "./application/ports/userDocumentRepository.js";
import type { CsvMappingRepository } from "./application/ports/csvMappingRepository.js";
import type { CsvImportRepository } from "./application/ports/csvImportRepository.js";
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
import { createCsvService, type CsvService } from "./application/services/csvService.js";
import {
  createCsvMappingService,
  type CsvMappingService,
} from "./application/services/csvMappingService.js";
import {
  createCsvImportService,
  type CsvImportService,
} from "./application/services/csvImportService.js";
import { env } from "./config/env.js";
import { getPrismaClient } from "./db/prisma.js";
import { getMongoClient } from "./db/mongodb.js";
import { GoogleTokenInfoIdentityProvider } from "./infrastructure/auth/googleTokenInfoIdentityProvider.js";
import { HmacSessionTokenService } from "./infrastructure/auth/hmacSessionTokenService.js";
import { BcryptPasswordHasher } from "./infrastructure/auth/bcryptPasswordHasher.js";
import { PrismaCalendarEventRepository } from "./infrastructure/repositories/prismaCalendarEventRepository.js";
import { PrismaUserRepository } from "./infrastructure/repositories/prismaUserRepository.js";
import { MongoCsvMappingRepository } from "./infrastructure/repositories/mongoCsvMappingRepository.js";
import { MongoCsvImportRepository } from "./infrastructure/repositories/mongoCsvImportRepository.js";

export type AppContainer = {
  calendarEventService: CalendarEventService;
  calendarDaysService: CalendarDayService;
  authService: AuthService;
  userService: UserService;
  csvService: CsvService;
  csvMappingService: CsvMappingService;
  csvImportService: CsvImportService;
};

export type AppContainerOverrides = Partial<AppContainer> & {
  calendarEventRepository?: CalendarEventRepository;
  googleIdentityProvider?: GoogleIdentityProvider;
  sessionTokenService?: SessionTokenService;
  passwordHasher?: PasswordHasher;
  userRepository?: UserRepository;
  userDocumentRepository?: UserDocumentRepository;
  csvMappingRepository?: CsvMappingRepository;
  csvImportRepository?: CsvImportRepository;
};

export const createContainer = (overrides: AppContainerOverrides = {}): AppContainer => {
  let calendarEventRepository = overrides.calendarEventRepository;
  let userRepository = overrides.userRepository;
  let googleIdentityProvider = overrides.googleIdentityProvider;
  let sessionTokenService = overrides.sessionTokenService;
  let passwordHasher = overrides.passwordHasher;
  let csvMappingRepository = overrides.csvMappingRepository;
  let csvImportRepository = overrides.csvImportRepository;
  let resolvedCsvMappingService = overrides.csvMappingService;

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

  const getCsvMappingRepository = (): CsvMappingRepository => {
    if (!csvMappingRepository) {
      csvMappingRepository = new MongoCsvMappingRepository(getMongoClient, env.MONGODB_DB_NAME);
    }
    return csvMappingRepository;
  };

  const getCsvImportRepository = (): CsvImportRepository => {
    if (!csvImportRepository) {
      csvImportRepository = new MongoCsvImportRepository(getMongoClient, env.MONGODB_DB_NAME);
    }
    return csvImportRepository;
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

  const csvService = overrides.csvService ?? createCsvService();

  const getResolvedCsvMappingService = (): CsvMappingService => {
    if (!resolvedCsvMappingService) {
      resolvedCsvMappingService = createCsvMappingService(getCsvMappingRepository());
    }
    return resolvedCsvMappingService;
  };

  const csvMappingService: CsvMappingService = {
    findById: (id) => getResolvedCsvMappingService().findById(id),
    listMappings: (userId) => getResolvedCsvMappingService().listMappings(userId),
    saveMapping: (userId, input) => getResolvedCsvMappingService().saveMapping(userId, input),
  };

  const csvImportService =
    overrides.csvImportService ??
    createCsvImportService(csvMappingService, getCsvImportRepository());

  return {
    calendarEventService,
    calendarDaysService,
    authService,
    userService,
    csvService,
    csvMappingService,
    csvImportService,
  };
};
