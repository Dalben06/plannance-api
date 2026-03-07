import type { UserRegistration, UserView } from "../../domain/user.js";
import type { PasswordHasher } from "../ports/passwordHasher.js";
import type { UserRepository } from "../ports/userRepository.js";

export type UserService = {
  create(form: UserRegistration): Promise<UserView>;
};

export const createUserService = (
  repository: UserRepository,
  passwordHasher: PasswordHasher,
): UserService => ({
  create: async (form) => {
    const hashedPassword = passwordHasher.hash(form.password);
    return repository.create({
      name: form.name,
      email: form.email,
      picture: form.picture,
      password: hashedPassword,
    });
  },
});
