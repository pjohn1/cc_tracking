"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button, ErrorText } from "@/components/ui";
import { isCancelled, postJSON } from "@/lib/client";

export function UnlockButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function unlock() {
    setBusy(true);
    setError("");
    try {
      const optionsJSON = await postJSON<Parameters<typeof startAuthentication>[0]["optionsJSON"]>(
        "/api/auth/login/options",
      );
      const response = await startAuthentication({ optionsJSON });
      await postJSON("/api/auth/login/verify", { response });
      window.location.replace("/");
    } catch (err) {
      if (!isCancelled(err)) setError(err instanceof Error ? err.message : "Couldn't unlock");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={unlock} disabled={busy} className="w-full">
        {busy ? "Unlocking…" : "Unlock with Face ID"}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
