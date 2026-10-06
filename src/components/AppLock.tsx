"use client";

import { useEffect, useState } from "react";
import { APP_LOCK_MS } from "@/lib/auth/policy";

// Locks the app (ends the session) when it comes back after APP_LOCK_MS in the background,
// and covers the screen while hidden so balances don't show in the iOS app switcher.
export function AppLock() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let hiddenAt: number | null = null;

    async function onChange() {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        setHidden(true);
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= APP_LOCK_MS) {
        await fetch("/api/auth/lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }).catch(() => {});
        window.location.replace("/login");
        return;
      }
      hiddenAt = null;
      setHidden(false);
    }

    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  if (!hidden) return null;
  return <div aria-hidden className="fixed inset-0 z-50 bg-bg" />;
}
