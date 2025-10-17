import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { drizzle } from "drizzle-orm/bun-sqlite";

const dataDir = ".data";
const url = "file:./.data/dev.sqlite";
mkdirSync(dataDir, { recursive: true });
const sqlite = new Database(url);

export const db = drizzle({ client: sqlite });
