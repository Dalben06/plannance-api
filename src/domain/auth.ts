export class AuthenticationError extends Error {}

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
};

export type AuthProvider = "google" | "email_password";

export type AuthForm =
  | { type: "google"; tokenId: string }
  | { type: "email_password"; username: string; password: string };

export type AuthSession = {
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: AuthenticatedUser;
};

export type SessionTokenPayload = {
  sub: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
  iat: number;
  exp: number;
};
