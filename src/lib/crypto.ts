import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

const VERSION = "v1";

// AES-256-GCM. Output: "v1.<iv>.<tag>.<ciphertext>", all base64url.
// `context` is bound as associated data so a ciphertext can't be moved to another row.
export function encrypt(plaintext: string, keyB64: string, context: string): string {
  const key = Buffer.from(keyB64, "base64");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(context));
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [VERSION, iv, cipher.getAuthTag(), ct]
    .map((p) => (typeof p === "string" ? p : p.toString("base64url")))
    .join(".");
}

export function decrypt(payload: string, keyB64: string, context: string): string {
  const [version, iv, tag, ct] = payload.split(".");
  if (version !== VERSION || !iv || !tag || ct === undefined) {
    throw new Error("Malformed ciphertext");
  }
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(keyB64, "base64"), Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Constant-time comparison that doesn't leak length.
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(Buffer.from(sha256(a), "hex"), Buffer.from(sha256(b), "hex"));
}
