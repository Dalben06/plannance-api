import { describe, expect, it, vi } from "vitest";
import { createAuthService } from "../../../src/application/services/authService.js";
import { AuthenticationError } from "../../../src/domain/auth.js";
import type { GoogleIdentityProvider } from "../../../src/application/ports/googleIdentityProvider.js";
import type { SessionTokenService } from "../../../src/application/ports/sessionTokenService.js";
import type {
  UserRepository,
  UserWithPassword,
} from "../../../src/application/ports/userRepository.js";
import type { PasswordHasher } from "../../../src/application/ports/passwordHasher.js";
import type { AuthenticatedUser } from "../../../src/domain/auth.js";
import type { UserView } from "../../../src/domain/user.js";

const sampleUser: AuthenticatedUser = {
  id: "google-user-id",
  email: "user@example.com",
  name: "Test User",
  picture: "https://example.com/pic.jpg",
  emailVerified: true,
};

const sampleUserView: UserView = {
  id: "google-user-id",
  email: "user@example.com",
  name: "Test User",
  picture: "https://example.com/pic.jpg",
};

const buildMocks = () => {
  const googleProvider: GoogleIdentityProvider = {
    verifyIdToken: vi.fn(),
  };
  const sessionTokenService: SessionTokenService = {
    create: vi.fn().mockReturnValue({ token: "mock-token", expiresIn: 3600 }),
    verify: vi.fn(),
  };
  const userRepository: UserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
  };
  const passwordHasher: PasswordHasher = {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    verify: vi.fn().mockResolvedValue(false),
  };
  return { googleProvider, sessionTokenService, userRepository, passwordHasher };
};

describe("AuthService", () => {
  describe("authenticate with google", () => {
    it("returns a session for a valid Google token when user already exists", async () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      vi.mocked(googleProvider.verifyIdToken).mockResolvedValue(sampleUser);
      vi.mocked(userRepository.findById).mockResolvedValue(sampleUserView);

      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );
      const session = await service.authenticate({ type: "google", tokenId: "gtoken" });

      expect(session.accessToken).toBe("mock-token");
      expect(session.tokenType).toBe("Bearer");
      expect(session.user).toEqual(sampleUser);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("creates a user on first Google login", async () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      vi.mocked(googleProvider.verifyIdToken).mockResolvedValue(sampleUser);
      vi.mocked(userRepository.findById).mockResolvedValue(null);
      vi.mocked(userRepository.create).mockResolvedValue(sampleUserView);

      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );
      await service.authenticate({ type: "google", tokenId: "gtoken" });

      expect(userRepository.create).toHaveBeenCalledWith({
        id: sampleUser.id,
        name: sampleUser.name,
        email: sampleUser.email,
        picture: sampleUser.picture,
        password: "",
      });
    });

    it("throws AuthenticationError when Google account has no email", async () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      vi.mocked(googleProvider.verifyIdToken).mockResolvedValue({ ...sampleUser, email: null });

      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );

      await expect(
        service.authenticate({ type: "google", tokenId: "gtoken" })
      ).rejects.toBeInstanceOf(AuthenticationError);
    });

    it("throws AuthenticationError when Google account has no name", async () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      vi.mocked(googleProvider.verifyIdToken).mockResolvedValue({ ...sampleUser, name: null });

      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );

      await expect(
        service.authenticate({ type: "google", tokenId: "gtoken" })
      ).rejects.toBeInstanceOf(AuthenticationError);
    });
  });

  describe("authenticate with email_password", () => {
    it("looks up user by email, verifies password, and returns a session for valid credentials", async () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      const userWithPassword: UserWithPassword = { ...sampleUserView, passwordHash: "stored-hash" };
      vi.mocked(userRepository.findByEmail).mockResolvedValue(userWithPassword);
      vi.mocked(passwordHasher.verify).mockResolvedValue(true);

      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );
      const session = await service.authenticate({
        type: "email_password",
        username: "user@example.com",
        password: "plainpassword",
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith("user@example.com");
      expect(passwordHasher.verify).toHaveBeenCalledWith("plainpassword", "stored-hash");
      expect(session.accessToken).toBe("mock-token");
      expect(session.user.emailVerified).toBe(true);
    });

    it("throws AuthenticationError for blank username", async () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );

      await expect(
        service.authenticate({ type: "email_password", username: "  ", password: "pass" })
      ).rejects.toBeInstanceOf(AuthenticationError);
    });

    it("throws AuthenticationError for blank password", async () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );

      await expect(
        service.authenticate({
          type: "email_password",
          username: "user@example.com",
          password: "   ",
        })
      ).rejects.toBeInstanceOf(AuthenticationError);
    });

    it("throws AuthenticationError when user is not found", async () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );

      await expect(
        service.authenticate({
          type: "email_password",
          username: "unknown@example.com",
          password: "wrong",
        })
      ).rejects.toBeInstanceOf(AuthenticationError);
    });

    it("throws AuthenticationError when password does not match", async () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      const userWithPassword: UserWithPassword = { ...sampleUserView, passwordHash: "stored-hash" };
      vi.mocked(userRepository.findByEmail).mockResolvedValue(userWithPassword);
      vi.mocked(passwordHasher.verify).mockResolvedValue(false);

      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );

      await expect(
        service.authenticate({
          type: "email_password",
          username: "user@example.com",
          password: "wrong",
        })
      ).rejects.toBeInstanceOf(AuthenticationError);
    });
  });

  describe("verifyAccessToken", () => {
    it("returns the authenticated user from a valid token", () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      vi.mocked(sessionTokenService.verify).mockReturnValue({
        sub: sampleUser.id,
        email: sampleUser.email,
        name: sampleUser.name,
        picture: sampleUser.picture,
        emailVerified: sampleUser.emailVerified,
        iat: 1000,
        exp: 9999999999,
      });

      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );
      const user = service.verifyAccessToken("valid-token");

      expect(user).toEqual(sampleUser);
    });

    it("throws AuthenticationError for a blank token", () => {
      const { googleProvider, sessionTokenService, userRepository, passwordHasher } = buildMocks();
      const service = createAuthService(
        googleProvider,
        sessionTokenService,
        userRepository,
        passwordHasher
      );

      expect(() => service.verifyAccessToken("   ")).toThrow(AuthenticationError);
    });
  });
});
