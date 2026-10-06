import "server-only";
import { db } from "./db";

// Fixed-window counter in Postgres. Returns false once `max` is exceeded.
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const [row] = await db()<{ count: number }[]>`
    insert into rate_limits (key, window_start, count)
    values (${key}, now(), 1)
    on conflict (key) do update set
      count = case
        when rate_limits.window_start < now() - ${windowMs / 1000} * interval '1 second' then 1
        else rate_limits.count + 1
      end,
      window_start = case
        when rate_limits.window_start < now() - ${windowMs / 1000} * interval '1 second' then now()
        else rate_limits.window_start
      end
    returning count
  `;
  return row.count <= max;
}
