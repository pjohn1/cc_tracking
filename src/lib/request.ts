import "server-only";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "./env";

export type RequestMeta = { ip: string | null; userAgent: string | null };

export async function requestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
  };
}

// Defense in depth against CSRF on top of SameSite=Strict cookies:
// state-changing requests must come from our own origin.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === env().APP_ORIGIN;
}

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}
