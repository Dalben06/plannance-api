import type { AuthenticatedUser } from "../../domain/auth.js";

export interface GoogleIdentityProvider {
  verifyIdToken(idToken: string): Promise<AuthenticatedUser>;
}
