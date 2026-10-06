// Session timing rules, kept pure so they're easy to test.

export const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_IDLE_MS = 30 * 60 * 1000; // 30 minutes
export const APP_LOCK_MS = 5 * 60 * 1000; // re-lock after 5 minutes in the background
export const RECENT_AUTH_MS = 10 * 60 * 1000; // sensitive actions need a sign-in this recent
export const TOUCH_INTERVAL_MS = 60 * 1000; // don't write last_seen more than once a minute

export type SessionTimes = {
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
};

export function isSessionValid(s: SessionTimes, now: Date): boolean {
  return now < s.expiresAt && now.getTime() - s.lastSeenAt.getTime() < SESSION_IDLE_MS;
}

export function isRecentAuth(s: SessionTimes, now: Date): boolean {
  return now.getTime() - s.createdAt.getTime() < RECENT_AUTH_MS;
}

export function needsTouch(s: SessionTimes, now: Date): boolean {
  return now.getTime() - s.lastSeenAt.getTime() >= TOUCH_INTERVAL_MS;
}
