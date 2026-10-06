"use client";

import { useState, type FormEvent } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button, ErrorText } from "@/components/ui";
import { isCancelled, postJSON } from "@/lib/client";

export function SetupForm() {
  const [setupToken, setSetupToken] = useState("");
  const [deviceName, setDeviceName] = useState("iPhone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const optionsJSON = await postJSON<Parameters<typeof startRegistration>[0]["optionsJSON"]>(
        "/api/auth/register/options",
        { setupToken },
      );
      const response = await startRegistration({ optionsJSON });
      await postJSON("/api/auth/register/verify", { setupToken, deviceName, response });
      window.location.replace("/");
    } catch (err) {
      if (!isCancelled(err)) setError(err instanceof Error ? err.message : "Setup failed");
      setBusy(false);
    }
  }

  const field = "min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[17px]";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[15px] font-medium">Setup code</span>
        <input
          className={field}
          value={setupToken}
          onChange={(e) => setSetupToken(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          required
        />
        <span className="text-[13px] text-muted">The SETUP_TOKEN value from your server settings.</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[15px] font-medium">Device name</span>
        <input className={field} value={deviceName} onChange={(e) => setDeviceName(e.target.value)} maxLength={60} required />
      </label>
      <Button type="submit" disabled={busy} className="mt-2 w-full">
        {busy ? "Waiting for Face ID…" : "Create passkey"}
      </Button>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}
