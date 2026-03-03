import type { AuthenticatedUser, SessionTokenPayload } from "../../domain/auth.js";

export interface SessionTokenService {
  create(user: AuthenticatedUser): {
    token: string;
    expiresIn: number;
  };
  verify(token: string): SessionTokenPayload;
}
