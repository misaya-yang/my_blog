import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ quiet: true });
dotenv.config({ path: ".env.local", override: true, quiet: true });

const connectionString =
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
