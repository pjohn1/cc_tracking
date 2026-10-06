import "server-only";
import { z } from "zod";

const schema = z.object({
  APP_ORIGIN: z.url(),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "must start with postgresql:// (no quotes)"),
  SETUP_TOKEN: z.string().min(24).optional().or(z.literal("")),
  TOKEN_ENC_KEY: z
    .string()
    .refine((v) => Buffer.from(v, "base64").length === 32, "must be 32 bytes, base64"),
  CRON_SECRET: z.string().min(32),
});

type Env = z.infer<typeof schema> & { RP_ID: string };

let cached: Env | undefined;

// Validated lazily so `next build` works without secrets present.
export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const fields = parsed.error.issues.map((i) => `${i.path.join(".")} (${i.message})`).join(", ");
      throw new Error(`Invalid or missing environment variables: ${fields}`);
    }
    const origin = new URL(parsed.data.APP_ORIGIN);
    cached = { ...parsed.data, APP_ORIGIN: origin.origin, RP_ID: origin.hostname };
  }
  return cached;
}
