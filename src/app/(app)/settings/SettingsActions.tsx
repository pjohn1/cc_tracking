"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { Button, ErrorText } from "@/components/ui";
import { isCancelled, postJSON } from "@/lib/client";

export function AddDeviceButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    const deviceName = window.prompt("Name this device (for example, iPad or MacBook)")?.trim();
    if (!deviceName) return;
    setBusy(true);
    setError("");
    try {
      const optionsJSON = await postJSON<Parameters<typeof startRegistration>[0]["optionsJSON"]>(
        "/api/auth/register/options",
      );
      const response = await startRegistration({ optionsJSON });
      await postJSON("/api/auth/register/verify", { deviceName, response });
      router.refresh();
    } catch (err) {
      if (!isCancelled(err)) setError(err instanceof Error ? err.message : "Couldn't add device");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" onClick={add} disabled={busy} className="w-full">
        {busy ? "Waiting…" : "Add a backup device"}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

export function RemoveDeviceButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm(`Remove ${name}? It will no longer be able to unlock this app.`)) return;
    try {
      await postJSON("/api/auth/passkeys/remove", { id });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove device");
    }
  }

  return (
    <div className="shrink-0 text-right">
      <button onClick={remove} className="min-h-11 px-2 text-[15px] font-medium text-danger">
        Remove
      </button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

export function SignOutButtons() {
  async function signOut(everywhere: boolean) {
    if (everywhere && !window.confirm("Sign out on every device?")) return;
    await postJSON("/api/auth/logout", { everywhere }).catch(() => {});
    window.location.replace("/login");
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="secondary" onClick={() => signOut(false)} className="w-full">
        Lock now
      </Button>
      <Button variant="danger" onClick={() => signOut(true)} className="w-full">
        Sign out everywhere
      </Button>
    </div>
  );
}
