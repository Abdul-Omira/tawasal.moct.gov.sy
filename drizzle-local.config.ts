import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema-local.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./local-dev.db",
  },
});

