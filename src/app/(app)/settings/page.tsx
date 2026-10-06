import { requireSession } from "@/lib/auth/session";
import { listCredentials } from "@/lib/auth/webauthn";
import { recentAudit, type AuditEvent } from "@/lib/audit";
import { Card, SectionTitle } from "@/components/ui";
import { AddDeviceButton, RemoveDeviceButton, SignOutButtons } from "./SettingsActions";

const EVENT_LABELS: Record<AuditEvent, string> = {
  "setup.completed": "App set up",
  "login.success": "Unlocked",
  "login.failed": "Failed unlock attempt",
  logout: "Signed out",
  "logout.all": "Signed out everywhere",
  "app.locked": "Auto-locked",
  "passkey.added": "Device added",
  "passkey.removed": "Device removed",
  "ratelimit.blocked": "Too many attempts blocked",
};

const ALERT_EVENTS = new Set<AuditEvent>(["login.failed", "ratelimit.blocked"]);

function formatWhen(d: Date) {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function SettingsPage() {
  const session = await requireSession();
  const [devices, activity] = await Promise.all([listCredentials(), recentAudit(30)]);

  return (
    <div className="space-y-6">
      <h1 className="px-1 text-3xl font-bold tracking-tight">Settings</h1>

      <div>
        <SectionTitle>Devices that can unlock</SectionTitle>
        <Card flush className="divide-y divide-line">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-medium">
                  {d.device_name}
                  {d.id === session.credentialId && <span className="ml-2 text-[13px] text-accent">This device</span>}
                </p>
                <p className="text-[13px] text-muted">
                  Added {formatWhen(d.created_at)}
                  {d.backed_up ? " · Synced with iCloud Keychain" : ""}
                </p>
              </div>
              {d.id !== session.credentialId && devices.length > 1 && <RemoveDeviceButton id={d.id} name={d.device_name} />}
            </div>
          ))}
        </Card>
        <div className="mt-3">
          <AddDeviceButton />
        </div>
      </div>

      <div>
        <SectionTitle>Sign out</SectionTitle>
        <SignOutButtons />
      </div>

      <div>
        <SectionTitle>Recent activity</SectionTitle>
        <Card flush className="divide-y divide-line">
          {activity.map((a) => (
            <div key={a.id} className="flex items-baseline justify-between gap-3 px-5 py-3">
              <span className={ALERT_EVENTS.has(a.event) ? "text-danger" : ""}>
                {EVENT_LABELS[a.event] ?? a.event}
                {typeof a.detail.device === "string" && <span className="text-muted"> · {a.detail.device}</span>}
              </span>
              <span className="shrink-0 text-[13px] text-muted">{formatWhen(a.at)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
