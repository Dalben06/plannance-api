import { describe, expect, it, vi } from "vitest";
import { createUserService } from "../src/application/services/userService.js";
import type { UserRepository } from "../src/application/ports/userRepository.js";
import type { PasswordHasher } from "../src/application/ports/passwordHasher.js";
import type { UserView } from "../src/domain/user.js";

const sampleUserView: UserView = {
  id: "generated-uuid",
  email: "user@example.com",
  name: "Test User",
  picture: null,
};

const buildMocks = () => {
  const repository: UserRepository = {
    findById: vi.fn(),
    getByCredentials: vi.fn(),
    create: vi.fn().mockResolvedValue(sampleUserView),
  };
  const passwordHasher: PasswordHasher = {
    hash: vi.fn().mockReturnValue("hashed-pw"),
    verify: vi.fn(),
  };
  return { repository, passwordHasher };
};

describe("UserService", () => {
  describe("create", () => {
    it("hashes the password before creating the user", async () => {
      const { repository, passwordHasher } = buildMocks();
      const service = createUserService(repository, passwordHasher);

      await service.create({ name: "Test User", email: "user@example.com", picture: null, password: "plain" });

      expect(passwordHasher.hash).toHaveBeenCalledWith("plain");
      expect(repository.create).toHaveBeenCalledWith({
        name: "Test User",
        email: "user@example.com",
        picture: null,
        password: "hashed-pw",
      });
    });

    it("does not mutate the input form", async () => {
      const { repository, passwordHasher } = buildMocks();
      const service = createUserService(repository, passwordHasher);
      const form = { name: "Test User", email: "user@example.com", picture: null, password: "plain" };

      await service.create(form);

      expect(form.password).toBe("plain");
    });

    it("returns the UserView from the repository", async () => {
      const { repository, passwordHasher } = buildMocks();
      const service = createUserService(repository, passwordHasher);

      const result = await service.create({ name: "Test User", email: "user@example.com", picture: null, password: "plain" });

      expect(result).toEqual(sampleUserView);
    });

    it("passes null picture when no picture is provided", async () => {
      const { repository, passwordHasher } = buildMocks();
      const service = createUserService(repository, passwordHasher);

      await service.create({ name: "Test User", email: "user@example.com", picture: null, password: "plain" });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ picture: null }));
    });
  });
});
