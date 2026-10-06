import "server-only";
import { db } from "./db";
import { requestMeta } from "./request";

export type AuditEvent =
  | "setup.completed"
  | "login.success"
  | "login.failed"
  | "logout"
  | "logout.all"
  | "app.locked"
  | "passkey.added"
  | "passkey.removed"
  | "ratelimit.blocked";

export async function audit(event: AuditEvent, detail: Record<string, unknown> = {}) {
  const { ip, userAgent } = await requestMeta();
  await db()`
    insert into audit_log (event, detail, ip, user_agent)
    values (${event}, ${db().json(detail as never)}, ${ip}, ${userAgent})
  `;
}

export type AuditRow = {
  id: string;
  at: Date;
  event: AuditEvent;
  detail: Record<string, unknown>;
  ip: string | null;
  user_agent: string | null;
};

export async function recentAudit(limit = 50): Promise<AuditRow[]> {
  return db()<AuditRow[]>`
    select id, at, event, detail, ip, user_agent
    from audit_log order by at desc limit ${limit}
  `;
}
