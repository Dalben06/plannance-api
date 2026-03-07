import type { UserCreate, UserView } from "../../domain/user.js";

export interface UserRepository {
  findById(id: string): Promise<UserView | null>;
  getByCredentials(email: string, hashedPassword: string): Promise<UserView>;
  create(user: UserCreate): Promise<UserView>;
}
