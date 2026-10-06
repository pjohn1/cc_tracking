import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt, safeEqual, sha256 } from "./crypto";

const key = randomBytes(32).toString("base64");

describe("encrypt/decrypt", () => {
  it("round-trips", () => {
    const ct = encrypt("access-sandbox-123", key, "item:1");
    expect(ct).not.toContain("access-sandbox-123");
    expect(decrypt(ct, key, "item:1")).toBe("access-sandbox-123");
  });

  it("uses a fresh IV every time", () => {
    expect(encrypt("same", key, "c")).not.toBe(encrypt("same", key, "c"));
  });

  it("rejects tampered ciphertext", () => {
    const parts = encrypt("secret", key, "c").split(".");
    const ct = Buffer.from(parts[3], "base64url");
    ct[0] ^= 1;
    parts[3] = ct.toString("base64url");
    expect(() => decrypt(parts.join("."), key, "c")).toThrow();
  });

  it("rejects a ciphertext moved to another row", () => {
    expect(() => decrypt(encrypt("secret", key, "item:1"), key, "item:2")).toThrow();
  });

  it("rejects the wrong key", () => {
    const other = randomBytes(32).toString("base64");
    expect(() => decrypt(encrypt("secret", key, "c"), other, "c")).toThrow();
  });

  it("rejects malformed input", () => {
    expect(() => decrypt("garbage", key, "c")).toThrow("Malformed");
  });
});

describe("safeEqual / sha256", () => {
  it("compares strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("hashes deterministically", () => {
    expect(sha256("x")).toBe(sha256("x"));
    expect(sha256("x")).toHaveLength(64);
  });
});
