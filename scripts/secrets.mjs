// Prints fresh random values for the secret env vars.
import { randomBytes } from "node:crypto";

console.log(`SETUP_TOKEN=${randomBytes(24).toString("base64url")}`);
console.log(`TOKEN_ENC_KEY=${randomBytes(32).toString("base64")}`);
console.log(`CRON_SECRET=${randomBytes(32).toString("base64url")}`);
