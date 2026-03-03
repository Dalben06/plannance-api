export class AuthenticationError extends Error {}

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
};

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
