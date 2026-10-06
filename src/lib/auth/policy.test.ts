import { describe, expect, it } from "vitest";
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS, isRecentAuth, isSessionValid, needsTouch } from "./policy";

const t0 = new Date("2026-10-06T12:00:00Z");
const at = (ms: number) => new Date(t0.getTime() + ms);
const session = { createdAt: t0, lastSeenAt: t0, expiresAt: at(SESSION_ABSOLUTE_MS) };

describe("session policy", () => {
  it("is valid right after sign-in", () => {
    expect(isSessionValid(session, at(1000))).toBe(true);
  });

  it("expires after the idle timeout", () => {
    expect(isSessionValid(session, at(SESSION_IDLE_MS - 1))).toBe(true);
    expect(isSessionValid(session, at(SESSION_IDLE_MS))).toBe(false);
  });

  it("expires at the absolute limit even when active", () => {
    const active = { ...session, lastSeenAt: at(SESSION_ABSOLUTE_MS - 1000) };
    expect(isSessionValid(active, at(SESSION_ABSOLUTE_MS))).toBe(false);
  });

  it("treats only fresh sign-ins as recent", () => {
    expect(isRecentAuth(session, at(5 * 60 * 1000))).toBe(true);
    expect(isRecentAuth(session, at(11 * 60 * 1000))).toBe(false);
  });

  it("throttles last-seen writes", () => {
    expect(needsTouch(session, at(30 * 1000))).toBe(false);
    expect(needsTouch(session, at(61 * 1000))).toBe(true);
  });
});
