import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "src/server/schema.ts",
  driver: "better-sqlite",
  dbCredentials: {
    url: "sqlite.db",
  },
  strict: true,
  verbose: true,
  out: "drizzle",
});
