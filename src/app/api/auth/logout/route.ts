import { z } from "zod";
import { guard, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { destroyAllSessions, destroySession } from "@/lib/auth/session";

const schema = z.object({ everywhere: z.boolean().optional() });

export async function POST(request: Request) {
  const g = await guard(request, { schema, auth: "required" });
  if (!g.ok) return g.response;

  if (g.body.everywhere) {
    await audit("logout.all");
    await destroyAllSessions();
  } else {
    await audit("logout");
    await destroySession();
  }
  return ok();
}
