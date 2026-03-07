import {
  AuthenticationError,
  type AuthForm,
  type AuthSession,
  type AuthenticatedUser,
  type SessionTokenPayload
} from "../../domain/auth.js";
import type { GoogleIdentityProvider } from "../ports/googleIdentityProvider.js";
import type { SessionTokenService } from "../ports/sessionTokenService.js";
import type { PasswordHasher } from "../ports/passwordHasher.js";
import type { UserRepository } from "../ports/userRepository.js";

export type AuthService = {
  authenticate(form: AuthForm): Promise<AuthSession>;
  verifyAccessToken(accessToken: string): AuthenticatedUser;
};

const toAuthenticatedUser = (
  payload: Pick<SessionTokenPayload, "sub" | "email" | "name" | "picture" | "emailVerified">
): AuthenticatedUser => ({
  id: payload.sub,
  email: payload.email,
  name: payload.name,
  picture: payload.picture,
  emailVerified: payload.emailVerified,
});

export const createAuthService = (
  googleIdentityProvider: GoogleIdentityProvider,
  sessionTokenService: SessionTokenService,
  userRepository: UserRepository,
  passwordHasher: PasswordHasher,
): AuthService => {

  const authenticateWithGoogle = async (tokenId: string): Promise<AuthSession> => {
    const googleUser = await googleIdentityProvider.verifyIdToken(tokenId);

    if (!googleUser.email || !googleUser.name) {
      throw new AuthenticationError("Google account must provide an email and name");
    }

    const existing = await userRepository.findById(googleUser.id);
    if (!existing) {
      await userRepository.create({
        id: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        password: "",
      });
    }

    const session = sessionTokenService.create(googleUser);
    return {
      accessToken: session.token,
      expiresIn: session.expiresIn,
      tokenType: "Bearer",
      user: googleUser,
    };
  };

  const authenticateWithCredentials = async (username: string, password: string): Promise<AuthSession> => {
    if (!username.trim() || !password.trim()) {
      throw new AuthenticationError("Username and password are required");
    }

    const hashedPassword = passwordHasher.hash(password);
    const userView = await userRepository.getByCredentials(username, hashedPassword);

    const user: AuthenticatedUser = {
      id: userView.id,
      email: userView.email,
      name: userView.name,
      picture: userView.picture,
      emailVerified: true,
    };

    const session = sessionTokenService.create(user);
    return {
      accessToken: session.token,
      expiresIn: session.expiresIn,
      tokenType: "Bearer",
      user,
    };
  };

  const authenticate = (form: AuthForm): Promise<AuthSession> => {
    if (form.type === "google") {
      return authenticateWithGoogle(form.tokenId);
    }
    return authenticateWithCredentials(form.username, form.password);
  };

  const verifyAccessToken = (accessToken: string): AuthenticatedUser => {
    if (!accessToken.trim()) {
      throw new AuthenticationError("Access token is required");
    }
    const payload = sessionTokenService.verify(accessToken);
    return toAuthenticatedUser(payload);
  };

  return { authenticate, verifyAccessToken };
};
