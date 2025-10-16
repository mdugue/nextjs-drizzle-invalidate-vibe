import { mkdirSync } from "fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const dbPath = "./.data/dev.sqlite";
mkdirSync("./.data", { recursive: true });

const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);
