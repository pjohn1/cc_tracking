import { defineConfig } from "@playwright/test";

// End-to-end tests run against a production build on localhost with the local database.
// Usage: npm run build && npm run e2e
export default defineConfig({
  testDir: "e2e",
  workers: 1,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npx next start -p 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
  },
});
