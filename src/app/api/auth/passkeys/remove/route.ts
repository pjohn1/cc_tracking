import { z } from "zod";
import { guard, ok } from "@/lib/api";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/request";
import { audit } from "@/lib/audit";
import { isRecentAuth } from "@/lib/auth/policy";

const schema = z.object({ id: z.string().min(1).max(1024) });

export async function POST(request: Request) {
  const g = await guard(request, { schema, auth: "required" });
  if (!g.ok) return g.response;

  if (!isRecentAuth(g.session!, new Date())) {
    return jsonError(403, "For safety, unlock again before removing a device");
  }
  if (g.session!.credentialId === g.body.id) {
    return jsonError(400, "You can't remove the passkey you're signed in with");
  }

  const removed = await db().begin(async (tx) => {
    const [{ count }] = await tx<{ count: number }[]>`select count(*)::int as count from credentials`;
    if (count <= 1) return null;
    const [row] = await tx<{ device_name: string }[]>`
      delete from credentials where id = ${g.body.id} returning device_name
    `;
    return row ?? null;
  });
  if (!removed) return jsonError(400, "Couldn't remove that passkey");

  await audit("passkey.removed", { device: removed.device_name });
  return ok();
}
