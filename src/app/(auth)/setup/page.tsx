import { connection } from "next/server";
import { redirect } from "next/navigation";
import { hasAnyCredential } from "@/lib/auth/webauthn";
import { SetupForm } from "./SetupForm";

export default async function SetupPage() {
  await connection();
  // Sign-up closes for good once the first passkey exists.
  if (await hasAnyCredential()) redirect("/login");

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Set up Card Tracker</h1>
        <p className="text-muted">
          Create a passkey so only your Face ID can open this app. There&rsquo;s no password to remember or leak.
        </p>
      </div>
      <SetupForm />
    </>
  );
}
