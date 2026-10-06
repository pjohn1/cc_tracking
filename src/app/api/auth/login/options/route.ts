import { z } from "zod";
import { guard, ok } from "@/lib/api";
import { loginOptions } from "@/lib/auth/webauthn";

export async function POST(request: Request) {
  const g = await guard(request, {
    schema: z.object({}),
    auth: "optional",
    rateLimit: { name: "login", max: 20, windowMs: 15 * 60 * 1000 },
  });
  if (!g.ok) return g.response;
  return ok(await loginOptions());
}
