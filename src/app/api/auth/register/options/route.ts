import { z } from "zod";
import { guard, ok } from "@/lib/api";
import { jsonError } from "@/lib/request";
import { canRegister } from "@/lib/auth/canRegister";
import { registrationOptions } from "@/lib/auth/webauthn";

const schema = z.object({ setupToken: z.string().max(200).optional() });

export async function POST(request: Request) {
  const g = await guard(request, {
    schema,
    auth: "optional",
    rateLimit: { name: "register", max: 10, windowMs: 15 * 60 * 1000 },
  });
  if (!g.ok) return g.response;

  const check = await canRegister(g.session, g.body.setupToken);
  if (!check.allowed) return jsonError(403, check.reason);

  return ok(await registrationOptions());
}
