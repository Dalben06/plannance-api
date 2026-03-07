import type { UserCreate, UserView } from "../../domain/user.js";

export type UserWithPassword = UserView & { passwordHash: string };

export interface UserRepository {
  findById(id: string): Promise<UserView | null>;
  findByEmail(email: string): Promise<UserWithPassword | null>;
  create(user: UserCreate): Promise<UserView>;
}
