import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { getSession, type Session } from "./auth/session";
import { rateLimit } from "./rateLimit";
import { audit } from "./audit";
import { isSameOrigin, jsonError, requestMeta } from "./request";

type Guarded<T> = { ok: true; body: T; session: Session | null } | { ok: false; response: NextResponse };

// Common checks for every state-changing API route:
// same-origin, optional per-IP rate limit, optional session, validated JSON body.
export async function guard<T>(
  request: Request,
  opts: {
    schema: z.ZodType<T>;
    auth: "required" | "optional";
    rateLimit?: { name: string; max: number; windowMs: number };
  },
): Promise<Guarded<T>> {
  if (!isSameOrigin(request)) return { ok: false, response: jsonError(403, "Bad origin") };

  if (opts.rateLimit) {
    const { ip } = await requestMeta();
    const key = `${opts.rateLimit.name}:${ip ?? "unknown"}`;
    if (!(await rateLimit(key, opts.rateLimit.max, opts.rateLimit.windowMs))) {
      await audit("ratelimit.blocked", { route: opts.rateLimit.name });
      return { ok: false, response: jsonError(429, "Too many attempts. Wait a few minutes.") };
    }
  }

  const session = await getSession();
  if (opts.auth === "required" && !session) return { ok: false, response: jsonError(401, "Not signed in") };

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    raw = {};
  }
  const parsed = opts.schema.safeParse(raw);
  if (!parsed.success) return { ok: false, response: jsonError(400, "Invalid request") };

  return { ok: true, body: parsed.data, session };
}

export function ok(data: object = { ok: true }) {
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
