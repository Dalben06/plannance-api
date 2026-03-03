import { z } from "zod";
import { AuthenticationError, type AuthenticatedUser } from "../../domain/auth.js";
import type { GoogleIdentityProvider } from "../../application/ports/googleIdentityProvider.js";

const tokenInfoSchema = z.object({
  sub: z.string().min(1),
  aud: z.string().min(1),
  iss: z.string().optional(),
  email: z.string().email().optional(),
  email_verified: z.union([z.boolean(), z.string()]).optional(),
  name: z.string().optional(),
  picture: z.string().url().optional()
});

const googleIssuers = new Set(["accounts.google.com", "https://accounts.google.com"]);

export class GoogleTokenInfoIdentityProvider implements GoogleIdentityProvider {
  constructor(
    private readonly clientId?: string,
    private readonly tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo"
  ) {}

  async verifyIdToken(idToken: string): Promise<AuthenticatedUser> {
    if (!this.clientId) {
      throw new Error("GOOGLE_CLIENT_ID is not configured");
    }

    if (!idToken.trim()) {
      throw new AuthenticationError("Google ID token is required");
    }

    const url = new URL(this.tokenInfoUrl);
    url.searchParams.set("id_token", idToken);

    let response: Response;

    try {
      response = await fetch(url);
    } catch {
      throw new Error("Unable to reach Google's token validation endpoint");
    }

    if (!response.ok) {
      throw new AuthenticationError("Invalid Google ID token");
    }

    const payload = tokenInfoSchema.safeParse(await response.json());

    if (!payload.success) {
      throw new AuthenticationError("Invalid Google ID token");
    }

    if (payload.data.aud !== this.clientId) {
      throw new AuthenticationError("Google token audience does not match the configured client");
    }

    if (payload.data.iss && !googleIssuers.has(payload.data.iss)) {
      throw new AuthenticationError("Google token issuer is invalid");
    }

    return {
      id: payload.data.sub,
      email: payload.data.email ?? null,
      name: payload.data.name ?? null,
      picture: payload.data.picture ?? null,
      emailVerified:
        payload.data.email_verified === true || payload.data.email_verified === "true"
    };
  }
}
