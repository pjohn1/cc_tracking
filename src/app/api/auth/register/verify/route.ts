import { z } from "zod";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { guard, ok } from "@/lib/api";
import { jsonError } from "@/lib/request";
import { audit } from "@/lib/audit";
import { canRegister } from "@/lib/auth/canRegister";
import { verifyRegistration } from "@/lib/auth/webauthn";
import { createSession } from "@/lib/auth/session";

const schema = z.object({
  setupToken: z.string().max(200).optional(),
  deviceName: z.string().trim().min(1).max(60),
  response: z.looseObject({ id: z.string(), type: z.literal("public-key") }),
});

export async function POST(request: Request) {
  const g = await guard(request, {
    schema,
    auth: "optional",
    rateLimit: { name: "register", max: 10, windowMs: 15 * 60 * 1000 },
  });
  if (!g.ok) return g.response;

  const check = await canRegister(g.session, g.body.setupToken);
  if (!check.allowed) return jsonError(403, check.reason);

  let credentialId: string | null = null;
  try {
    credentialId = await verifyRegistration(g.body.response as unknown as RegistrationResponseJSON, g.body.deviceName);
  } catch {
    credentialId = null;
  }
  if (!credentialId) return jsonError(400, "Couldn't verify the passkey. Try again.");

  if (check.mode === "setup") {
    await audit("setup.completed", { device: g.body.deviceName });
    await createSession(credentialId);
  } else {
    await audit("passkey.added", { device: g.body.deviceName });
  }
  return ok();
}
