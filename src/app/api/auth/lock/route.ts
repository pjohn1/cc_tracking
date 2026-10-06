import { z } from "zod";
import { guard, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { destroySession } from "@/lib/auth/session";

// Called by the app when it returns from the background after the lock timeout.
export async function POST(request: Request) {
  const g = await guard(request, { schema: z.object({}), auth: "optional" });
  if (!g.ok) return g.response;
  if (g.session) {
    await destroySession();
    await audit("app.locked");
  }
  return ok();
}
