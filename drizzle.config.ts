import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  driver: "better-sqlite", 
  dbCredentials: {
    url: "./.data/dev.sqlite",
  },
});
