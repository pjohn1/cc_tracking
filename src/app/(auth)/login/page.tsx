import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasAnyCredential } from "@/lib/auth/webauthn";
import { UnlockButton } from "./UnlockButton";

export default async function LoginPage() {
  await connection();
  if (await getSession()) redirect("/");
  if (!(await hasAnyCredential())) redirect("/setup");

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Card Tracker</h1>
        <p className="text-muted">Locked</p>
      </div>
      <UnlockButton />
    </>
  );
}
