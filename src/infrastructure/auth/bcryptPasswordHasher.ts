import bcrypt from "bcrypt";
import type { PasswordHasher } from "../../application/ports/passwordHasher.js";

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(value: string): Promise<string> {
    return bcrypt.hash(value, SALT_ROUNDS);
  }

  verify(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
