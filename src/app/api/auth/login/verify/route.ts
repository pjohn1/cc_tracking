import { z } from "zod";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { guard, ok } from "@/lib/api";
import { jsonError } from "@/lib/request";
import { audit } from "@/lib/audit";
import { verifyLogin } from "@/lib/auth/webauthn";
import { createSession, destroySession } from "@/lib/auth/session";

const schema = z.object({
  response: z.looseObject({ id: z.string().max(1024), type: z.literal("public-key") }),
});

export async function POST(request: Request) {
  const g = await guard(request, {
    schema,
    auth: "optional",
    rateLimit: { name: "login", max: 20, windowMs: 15 * 60 * 1000 },
  });
  if (!g.ok) return g.response;

  let credentialId: string | null = null;
  try {
    credentialId = await verifyLogin(g.body.response as unknown as AuthenticationResponseJSON);
  } catch {
    credentialId = null;
  }
  if (!credentialId) {
    await audit("login.failed");
    return jsonError(401, "That passkey didn't work. Try again.");
  }

  // Replace any existing session rather than stacking them.
  await destroySession();
  await createSession(credentialId);
  await audit("login.success", { credential: credentialId.slice(0, 8) });
  return ok();
}
