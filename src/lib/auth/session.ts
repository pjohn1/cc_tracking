import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../db";
import { env } from "../env";
import { randomToken, sha256 } from "../crypto";
import { requestMeta } from "../request";
import { SESSION_ABSOLUTE_MS, isSessionValid, needsTouch } from "./policy";

export type Session = {
  tokenHash: string;
  credentialId: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
};

function secure() {
  return env().APP_ORIGIN.startsWith("https://");
}

// __Host- prefix forces Secure, Path=/ and no Domain, so subdomains can't set or read it.
export function sessionCookieName() {
  return secure() ? "__Host-session" : "session";
}

export async function createSession(credentialId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_ABSOLUTE_MS);
  const { userAgent } = await requestMeta();
  await db()`
    insert into sessions (token_hash, credential_id, expires_at, user_agent)
    values (${sha256(token)}, ${credentialId}, ${expiresAt}, ${userAgent})
  `;
  (await cookies()).set(sessionCookieName(), token, {
    httpOnly: true,
    secure: secure(),
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return null;

  const [row] = await db()<Session[]>`
    select token_hash as "tokenHash", credential_id as "credentialId",
           created_at as "createdAt", last_seen_at as "lastSeenAt", expires_at as "expiresAt"
    from sessions where token_hash = ${sha256(token)}
  `;
  if (!row) return null;

  const now = new Date();
  if (!isSessionValid(row, now)) {
    await db()`delete from sessions where token_hash = ${row.tokenHash}`;
    return null;
  }
  if (needsTouch(row, now)) {
    await db()`update sessions set last_seen_at = now() where token_hash = ${row.tokenHash}`;
  }
  return row;
}

// For pages: send signed-out visitors to the unlock screen.
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(sessionCookieName())?.value;
  if (token) await db()`delete from sessions where token_hash = ${sha256(token)}`;
  store.delete(sessionCookieName());
}

export async function destroyAllSessions(): Promise<void> {
  await db()`delete from sessions`;
  (await cookies()).delete(sessionCookieName());
}
