import "server-only";
import { env } from "../env";
import { safeEqual } from "../crypto";
import { hasAnyCredential } from "./webauthn";
import { isRecentAuth } from "./policy";
import type { Session } from "./session";

export type RegisterMode = "setup" | "add-device";

// First passkey: needs the one-time SETUP_TOKEN. Sign-up is closed after that.
// Extra passkeys: need a session from a sign-in in the last few minutes.
export async function canRegister(
  session: Session | null,
  setupToken: string | undefined,
): Promise<{ allowed: true; mode: RegisterMode } | { allowed: false; reason: string }> {
  if (!(await hasAnyCredential())) {
    const expected = env().SETUP_TOKEN;
    if (!expected) return { allowed: false, reason: "Setup is disabled" };
    if (!setupToken || !safeEqual(setupToken, expected)) return { allowed: false, reason: "Wrong setup code" };
    return { allowed: true, mode: "setup" };
  }
  if (!session) return { allowed: false, reason: "Setup is already complete" };
  if (!isRecentAuth(session, new Date())) {
    return { allowed: false, reason: "For safety, unlock again before adding a device" };
  }
  return { allowed: true, mode: "add-device" };
}
