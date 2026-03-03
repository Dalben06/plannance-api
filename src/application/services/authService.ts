import {
  AuthenticationError,
  type AuthSession,
  type AuthenticatedUser,
  type SessionTokenPayload
} from "../../domain/auth.js";
import type { GoogleIdentityProvider } from "../ports/googleIdentityProvider.js";
import type { SessionTokenService } from "../ports/sessionTokenService.js";

export type AuthService = {
  authenticateWithGoogle(idToken: string): Promise<AuthSession>;
  verifyAccessToken(accessToken: string): AuthenticatedUser;
};

const toAuthenticatedUser = (
  payload: Pick<
    SessionTokenPayload,
    "sub" | "email" | "name" | "picture" | "emailVerified"
  >
): AuthenticatedUser => ({
  id: payload.sub,
  email: payload.email,
  name: payload.name,
  picture: payload.picture,
  emailVerified: payload.emailVerified
});

export const createAuthService = (
  googleIdentityProvider: GoogleIdentityProvider,
  sessionTokenService: SessionTokenService
): AuthService => ({
  authenticateWithGoogle: async (idToken) => {
    const user = await googleIdentityProvider.verifyIdToken(idToken);
    const session = sessionTokenService.create(user);

    return {
      accessToken: session.token,
      expiresIn: session.expiresIn,
      tokenType: "Bearer",
      user
    };
  },
  verifyAccessToken: (accessToken) => {
    if (!accessToken.trim()) {
      throw new AuthenticationError("Access token is required");
    }

    const payload = sessionTokenService.verify(accessToken);
    return toAuthenticatedUser(payload);
  }
});
