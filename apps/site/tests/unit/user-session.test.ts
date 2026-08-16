import { describe, expect, it } from "vitest";
import {
  createUserSessionToken,
  setUserSessionCookie,
  verifyUserSession,
} from "../../../../functions/api/_lib/user-session";

const SECRET_A = "session-secret-a-with-enough-entropy-for-tests";
const SECRET_B = "session-secret-b-with-enough-entropy-for-tests";

function requestWithCookie(cookie: string) {
  return new Request("https://blackcrown.test/api/me", {
    headers: { cookie },
  });
}

describe("signed user sessions", () => {
  it("accepts a valid server-signed session", async () => {
    const env = { BC_USER_SESSION_SECRET: SECRET_A };
    const token = await createUserSessionToken(env, "user-a", 3600);
    expect(token).toBeTruthy();

    const claims = await verifyUserSession(requestWithCookie(`bc_session=${token}`), env);
    expect(claims?.userId).toBe("user-a");
    expect(claims?.expiresAt).toBeGreaterThan(claims?.issuedAt ?? 0);
  });

  it("rejects a tampered signed session", async () => {
    const env = { BC_USER_SESSION_SECRET: SECRET_A };
    const token = await createUserSessionToken(env, "user-a", 3600);
    expect(token).toBeTruthy();

    const parts = String(token).split(".");
    const payload = parts[1];
    parts[1] = `${payload[0] === "A" ? "B" : "A"}${payload.slice(1)}`;

    const claims = await verifyUserSession(requestWithCookie(`bc_session=${parts.join(".")}`), env);
    expect(claims).toBeNull();
  });

  it("rejects a token under a different server secret", async () => {
    const token = await createUserSessionToken({ BC_USER_SESSION_SECRET: SECRET_A }, "user-a", 3600);
    expect(token).toBeTruthy();

    const claims = await verifyUserSession(
      requestWithCookie(`bc_session=${token}`),
      { BC_USER_SESSION_SECRET: SECRET_B },
    );
    expect(claims).toBeNull();
  });

  it("never treats legacy bc_uid as an authenticated session", async () => {
    const claims = await verifyUserSession(
      requestWithCookie("bc_uid=user-a"),
      { BC_USER_SESSION_SECRET: SECRET_A },
    );
    expect(claims).toBeNull();
  });

  it("fails closed when no session secret exists", async () => {
    const token = await createUserSessionToken({}, "user-a", 3600);
    expect(token).toBeNull();
    const claims = await verifyUserSession(requestWithCookie("bc_session=anything"), {});
    expect(claims).toBeNull();
  });

  it("issues a hardened HttpOnly secure cookie", async () => {
    const cookie = await setUserSessionCookie({ BC_USER_SESSION_SECRET: SECRET_A }, "user-a", 3600);
    expect(cookie).toContain("bc_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
  });
});
