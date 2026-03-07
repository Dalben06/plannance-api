import { describe, expect, it, vi, afterEach } from "vitest";
import { GoogleTokenInfoIdentityProvider } from "../../../src/infrastructure/auth/googleTokenInfoIdentityProvider.js";
import { AuthenticationError } from "../../../src/domain/auth.js";

const CLIENT_ID = "my-client-id";
const TOKEN_INFO_URL = "https://example.com/tokeninfo";

const makeProvider = (clientId?: string) =>
  new GoogleTokenInfoIdentityProvider(clientId, TOKEN_INFO_URL);

const makeResponse = (ok: boolean, data: unknown) => ({
  ok,
  json: vi.fn().mockResolvedValue(data),
});

const validPayload = {
  sub: "google-user-id",
  aud: CLIENT_ID,
  iss: "accounts.google.com",
  email: "user@example.com",
  email_verified: "true",
  name: "Test User",
  picture: "https://example.com/pic.jpg",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GoogleTokenInfoIdentityProvider", () => {
  it("throws Error when clientId is not configured", async () => {
    const provider = makeProvider(undefined);

    await expect(provider.verifyIdToken("some-token")).rejects.toThrow(
      "GOOGLE_CLIENT_ID is not configured"
    );
  });

  it("throws AuthenticationError for blank token", async () => {
    const provider = makeProvider(CLIENT_ID);

    await expect(provider.verifyIdToken("   ")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("calls fetch with the correct URL including id_token param", async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(true, validPayload));
    vi.stubGlobal("fetch", fetchMock);
    const provider = makeProvider(CLIENT_ID);

    await provider.verifyIdToken("my-token");

    expect(fetchMock).toHaveBeenCalledOnce();
    const calledArg: URL = fetchMock.mock.calls[0][0];
    expect(calledArg.toString()).toBe(`${TOKEN_INFO_URL}?id_token=my-token`);
  });

  it("throws Error when fetch rejects (network failure)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network error")));
    const provider = makeProvider(CLIENT_ID);

    await expect(provider.verifyIdToken("my-token")).rejects.toThrow(
      "Unable to reach Google's token validation endpoint"
    );
  });

  it("throws AuthenticationError when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(false, {})));
    const provider = makeProvider(CLIENT_ID);

    await expect(provider.verifyIdToken("my-token")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("throws AuthenticationError when response body fails Zod schema (missing sub)", async () => {
    const badPayload = { aud: CLIENT_ID, iss: "accounts.google.com" }; // no `sub`
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(true, badPayload)));
    const provider = makeProvider(CLIENT_ID);

    await expect(provider.verifyIdToken("my-token")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("throws AuthenticationError when aud does not match clientId", async () => {
    const payload = { ...validPayload, aud: "wrong-client-id" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(true, payload)));
    const provider = makeProvider(CLIENT_ID);

    await expect(provider.verifyIdToken("my-token")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("throws AuthenticationError when iss is present but not in allowed set", async () => {
    const payload = { ...validPayload, iss: "https://evil.com" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(true, payload)));
    const provider = makeProvider(CLIENT_ID);

    await expect(provider.verifyIdToken("my-token")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("passes when iss is absent (no issuer check)", async () => {
    const { iss: _iss, ...payloadNoIss } = validPayload;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(true, payloadNoIss)));
    const provider = makeProvider(CLIENT_ID);

    const user = await provider.verifyIdToken("my-token");
    expect(user.id).toBe("google-user-id");
  });

  it("returns AuthenticatedUser with all fields populated", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(true, validPayload)));
    const provider = makeProvider(CLIENT_ID);

    const user = await provider.verifyIdToken("my-token");

    expect(user).toEqual({
      id: "google-user-id",
      email: "user@example.com",
      name: "Test User",
      picture: "https://example.com/pic.jpg",
      emailVerified: true,
    });
  });

  it("emailVerified is true when response contains string 'true'", async () => {
    const payload = { ...validPayload, email_verified: "true" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(true, payload)));
    const provider = makeProvider(CLIENT_ID);

    const user = await provider.verifyIdToken("my-token");
    expect(user.emailVerified).toBe(true);
  });

  it("emailVerified is false when response contains boolean false", async () => {
    const payload = { ...validPayload, email_verified: false };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(true, payload)));
    const provider = makeProvider(CLIENT_ID);

    const user = await provider.verifyIdToken("my-token");
    expect(user.emailVerified).toBe(false);
  });

  it("email, name, picture default to null when missing from response", async () => {
    const minimalPayload = { sub: "google-user-id", aud: CLIENT_ID };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(true, minimalPayload)));
    const provider = makeProvider(CLIENT_ID);

    const user = await provider.verifyIdToken("my-token");

    expect(user.email).toBeNull();
    expect(user.name).toBeNull();
    expect(user.picture).toBeNull();
    expect(user.emailVerified).toBe(false);
  });
});
