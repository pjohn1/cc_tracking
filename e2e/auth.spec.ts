import { expect, test, type Page } from "@playwright/test";
import postgres from "postgres";

// Wipes auth state so each run starts from first-time setup. Local database only.
async function resetDatabase() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
  await sql`truncate sessions, credentials, auth_challenges, audit_log, rate_limits, app_settings`;
  await sql.end();
}

// A software authenticator standing in for Face ID.
async function addVirtualAuthenticator(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

test.beforeAll(resetDatabase);

test("first-time setup, lock, unlock, and closed sign-up", async ({ page, request }) => {
  const cspErrors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && /Content Security Policy/i.test(m.text())) cspErrors.push(m.text());
  });
  await addVirtualAuthenticator(page);

  // Signed-out visitors land on setup while no passkey exists.
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);

  // Wrong code is refused.
  await page.getByLabel("Setup code").fill("wrong-code-wrong-code-wrong");
  await page.getByRole("button", { name: "Create passkey" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Wrong setup code" })).toBeVisible();

  // Right code creates the passkey and signs in.
  await page.getByLabel("Setup code").fill(process.env.SETUP_TOKEN!);
  await page.getByRole("button", { name: "Create passkey" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

  // Settings shows the device and the audit trail.
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByText("This device")).toBeVisible();
  await expect(page.getByText("App set up")).toBeVisible();

  // Lock, then unlock with the passkey.
  await page.getByRole("button", { name: "Lock now" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Unlock with Face ID" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

  // Setup is closed for good, even with the right code and no session.
  const res = await request.post("/api/auth/register/options", {
    headers: { origin: "http://localhost:3000" },
    data: { setupToken: process.env.SETUP_TOKEN },
  });
  expect(res.status()).toBe(403);
  expect(await res.json()).toEqual({ error: "Setup is already complete" });

  await page.goto("/setup");
  await expect(page).not.toHaveURL(/\/setup$/);

  expect(cspErrors).toEqual([]);
});
