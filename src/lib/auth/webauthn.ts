import "server-only";
import { cookies } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { db } from "../db";
import { env } from "../env";
import { randomToken } from "../crypto";

const RP_NAME = "Card Tracker";
const CHALLENGE_COOKIE = "wa_challenge";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

type Kind = "register" | "login";

export type CredentialRow = {
  id: string;
  device_name: string;
  backed_up: boolean;
  created_at: Date;
  last_used_at: Date | null;
};

export async function hasAnyCredential(): Promise<boolean> {
  const [row] = await db()<{ exists: boolean }[]>`select exists(select 1 from credentials) as exists`;
  return row.exists;
}

export async function listCredentials(): Promise<CredentialRow[]> {
  return db()<CredentialRow[]>`
    select id, device_name, backed_up, created_at, last_used_at
    from credentials order by created_at
  `;
}

async function saveChallenge(challenge: string, kind: Kind) {
  const id = randomToken(16);
  await db()`delete from auth_challenges where expires_at < now()`;
  await db()`
    insert into auth_challenges (id, challenge, kind, expires_at)
    values (${id}, ${challenge}, ${kind}, ${new Date(Date.now() + CHALLENGE_TTL_MS)})
  `;
  (await cookies()).set(CHALLENGE_COOKIE, id, {
    httpOnly: true,
    secure: env().APP_ORIGIN.startsWith("https://"),
    sameSite: "strict",
    path: "/api/auth",
    maxAge: CHALLENGE_TTL_MS / 1000,
  });
}

// Single use: the challenge is deleted as it's read.
async function consumeChallenge(kind: Kind): Promise<string | null> {
  const store = await cookies();
  const id = store.get(CHALLENGE_COOKIE)?.value;
  store.delete({ name: CHALLENGE_COOKIE, path: "/api/auth" });
  if (!id) return null;
  const [row] = await db()<{ challenge: string; kind: Kind; expires_at: Date }[]>`
    delete from auth_challenges where id = ${id} returning challenge, kind, expires_at
  `;
  if (!row || row.kind !== kind || row.expires_at < new Date()) return null;
  return row.challenge;
}

async function webauthnUserId(): Promise<Uint8Array<ArrayBuffer>> {
  const [existing] = await db()<{ value: string }[]>`
    select value #>> '{}' as value from app_settings where key = 'webauthn_user_id'
  `;
  if (existing) return new Uint8Array(Buffer.from(existing.value, "base64url"));
  const id = randomToken(16);
  await db()`
    insert into app_settings (key, value) values ('webauthn_user_id', ${db().json(id)})
    on conflict (key) do nothing
  `;
  return webauthnUserId();
}

export async function registrationOptions() {
  const existing = await db()<{ id: string; transports: string[] }[]>`select id, transports from credentials`;
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: env().RP_ID,
    userName: "me",
    userDisplayName: "Card Tracker",
    userID: await webauthnUserId(),
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({ id: c.id, transports: c.transports })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });
  await saveChallenge(options.challenge, "register");
  return options;
}

export async function verifyRegistration(response: RegistrationResponseJSON, deviceName: string) {
  const expectedChallenge = await consumeChallenge("register");
  if (!expectedChallenge) return null;

  const result = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: env().APP_ORIGIN,
    expectedRPID: env().RP_ID,
    requireUserVerification: true,
  });
  if (!result.verified) return null;

  const { credential, credentialBackedUp } = result.registrationInfo;
  await db()`
    insert into credentials (id, public_key, counter, transports, device_name, backed_up)
    values (${credential.id}, ${Buffer.from(credential.publicKey)}, ${credential.counter},
            ${credential.transports ?? []}, ${deviceName}, ${credentialBackedUp})
  `;
  return credential.id;
}

export async function loginOptions() {
  // Empty allowCredentials: the phone offers its saved passkey for this site (discoverable).
  const options = await generateAuthenticationOptions({
    rpID: env().RP_ID,
    userVerification: "required",
  });
  await saveChallenge(options.challenge, "login");
  return options;
}

export async function verifyLogin(response: AuthenticationResponseJSON): Promise<string | null> {
  const expectedChallenge = await consumeChallenge("login");
  if (!expectedChallenge) return null;

  const [cred] = await db()<{ id: string; public_key: Buffer; counter: string; transports: string[] }[]>`
    select id, public_key, counter, transports from credentials where id = ${response.id}
  `;
  if (!cred) return null;

  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: env().APP_ORIGIN,
    expectedRPID: env().RP_ID,
    requireUserVerification: true,
    credential: {
      id: cred.id,
      publicKey: new Uint8Array(cred.public_key),
      counter: Number(cred.counter),
      transports: cred.transports,
    },
  });
  if (!result.verified) return null;

  await db()`
    update credentials set counter = ${result.authenticationInfo.newCounter}, last_used_at = now()
    where id = ${cred.id}
  `;
  return cred.id;
}
