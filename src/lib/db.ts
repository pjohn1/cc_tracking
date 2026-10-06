import "server-only";
import postgres from "postgres";
import { env } from "./env";

declare global {
  var __sql: postgres.Sql | undefined;
}

// One pool per server instance; reused across hot reloads in dev.
export function db(): postgres.Sql {
  if (!globalThis.__sql) {
    globalThis.__sql = postgres(env().DATABASE_URL, {
      max: 3,
      idle_timeout: 20,
      // Supabase's transaction pooler doesn't support prepared statements.
      prepare: false,
    });
  }
  return globalThis.__sql;
}
