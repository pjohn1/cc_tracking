# Card Tracker

A private iPhone web app that tracks card balances, due dates, your bank balance, card credits, and offers. Only you can open it: sign-in is a passkey (Face ID), with no passwords.

## Run locally

Requires Node 20.9+ and Docker.

```bash
npm install
npm run db:up                  # start a local Postgres in Docker
cp .env.example .env.local
npm run secrets                # paste the printed values into .env.local
npm run db:migrate
npm run dev                    # http://localhost:3000
```

Open http://localhost:3000. It sends you to `/setup`. Enter your `SETUP_TOKEN` and create a passkey. After that, sign-up is closed for good.

## Checks

```bash
npm run check                  # types, lint, unit tests, dependency audit
npm run build && npm run e2e   # browser test of setup, lock and unlock (simulated Face ID)
```

## Deploy (free tiers)

1. **Supabase:** create a project. Copy the connection-pooler URL (Project Settings → Database, port 6543), then run:
   `DATABASE_URL=<url> node scripts/migrate.mjs`
2. **Vercel:** import the repo and set these env vars:
   - `APP_ORIGIN`: your exact `https://…vercel.app` URL
   - `DATABASE_URL`
   - `SETUP_TOKEN`, `TOKEN_ENC_KEY`, `CRON_SECRET` (from `npm run secrets`; use new values, not your local ones)
3. **Set up on your iPhone:**
   1. Open the URL in Safari, tap Share → **Add to Home Screen**, and open the app from the home screen.
   2. Complete setup with your `SETUP_TOKEN`.
   3. Delete `SETUP_TOKEN` from Vercel and redeploy. Setup is already closed, but this removes the secret.
4. In Settings, **add a backup device** (a Mac or iPad). Passkeys sync through iCloud Keychain, but a second device is a good safety net.

## Security model

- **Single user.** The first passkey needs a one-time setup code. Every later passkey needs a sign-in from the last 10 minutes.
- **Sessions:**
  - The cookie is random, `HttpOnly`, `Secure`, and `SameSite=Strict`.
  - The database stores only its SHA-256 hash.
  - Sessions end after 30 minutes idle or 7 days total.
  - The app locks after 5 minutes in the background and hides its content in the app switcher.
- **Every API call** checks the origin, validates its input with zod, and checks the session against the database. Sign-in routes are rate-limited.
- **Content-Security-Policy:** strict, with a new nonce per request, plus HSTS and protections against framing, sniffing and referrer leaks.
- **Bank tokens** (coming with Plaid) are encrypted with AES-256-GCM, bound to their database row, and never sent to the browser. The app is read-only and has no code that moves money.
- **Database:** row-level security is on with no policies, so Supabase's public API keys can't read anything.
- **Audit log** of unlocks, failed attempts and device changes, shown in Settings.

## Layout

| Path | Contents |
|---|---|
| `src/proxy.ts` | Per-request CSP and the signed-out redirect |
| `src/lib/auth/` | Passkeys, sessions, timing rules |
| `src/lib/api.ts` | The `guard()` every API route goes through |
| `src/app/(auth)/` | Unlock and setup screens |
| `src/app/(app)/` | Signed-in screens |
| `supabase/migrations/` | SQL schema |
