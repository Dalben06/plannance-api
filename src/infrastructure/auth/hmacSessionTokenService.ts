import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  AuthenticationError,
  type AuthenticatedUser,
  type SessionTokenPayload
} from "../../domain/auth.js";
import type { SessionTokenService } from "../../application/ports/sessionTokenService.js";

const jwtHeader = {
  alg: "HS256",
  typ: "JWT"
} as const;

const sessionTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email().nullable(),
  name: z.string().nullable(),
  picture: z.string().url().nullable(),
  emailVerified: z.boolean(),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive()
});

const encodeBase64Url = (value: string): string => Buffer.from(value).toString("base64url");

const decodeBase64Url = (value: string): string => Buffer.from(value, "base64url").toString("utf8");

export class HmacSessionTokenService implements SessionTokenService {
  constructor(
    private readonly secret?: string,
    private readonly ttlSeconds = 60 * 60
  ) {}

  create(user: AuthenticatedUser): { token: string; expiresIn: number } {
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload: SessionTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      emailVerified: user.emailVerified,
      iat: issuedAt,
      exp: issuedAt + this.ttlSeconds
    };

    return {
      token: this.sign(payload),
      expiresIn: this.ttlSeconds
    };
  }

  verify(token: string): SessionTokenPayload {
    const secret = this.getSecret();
    const parts = token.split(".");
    const encodedHeader = parts[0];
    const encodedPayload = parts[1];
    const signature = parts[2];

    if (parts.length !== 3 || !encodedHeader || !encodedPayload || !signature) {
      throw new AuthenticationError("Malformed access token");
    }

    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret
    );
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new AuthenticationError("Access token signature is invalid");
    }

    let header: Partial<typeof jwtHeader>;

    try {
      header = JSON.parse(decodeBase64Url(encodedHeader)) as Partial<typeof jwtHeader>;
    } catch {
      throw new AuthenticationError("Malformed access token");
    }

    if (header.alg !== jwtHeader.alg || header.typ !== jwtHeader.typ) {
      throw new AuthenticationError("Unsupported access token");
    }

    let rawPayload: unknown;

    try {
      rawPayload = JSON.parse(decodeBase64Url(encodedPayload));
    } catch {
      throw new AuthenticationError("Malformed access token");
    }

    const payload = sessionTokenPayloadSchema.safeParse(rawPayload);

    if (!payload.success) {
      throw new AuthenticationError("Malformed access token");
    }

    if (payload.data.exp <= Math.floor(Date.now() / 1000)) {
      throw new AuthenticationError("Access token has expired");
    }

    return payload.data;
  }

  private sign(payload: SessionTokenPayload): string {
    const secret = this.getSecret();
    const encodedHeader = encodeBase64Url(JSON.stringify(jwtHeader));
    const encodedPayload = encodeBase64Url(JSON.stringify(payload));

    return [
      encodedHeader,
      encodedPayload,
      this.createSignature(`${encodedHeader}.${encodedPayload}`, secret)
    ].join(".");
  }

  private createSignature(content: string, secret: string): string {
    return createHmac("sha256", secret).update(content).digest("base64url");
  }

  private getSecret(): string {
    if (!this.secret) {
      throw new Error("AUTH_JWT_SECRET is not configured");
    }

    return this.secret;
  }
}
