// Browser-side helper for calling our API routes.
export async function postJSON<T = unknown>(url: string, body: unknown = {}): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong");
  return data as T;
}

// WebAuthn errors from the browser when the person simply cancels the Face ID sheet.
export function isCancelled(err: unknown): boolean {
  return err instanceof Error && (err.name === "NotAllowedError" || err.name === "AbortError");
}
