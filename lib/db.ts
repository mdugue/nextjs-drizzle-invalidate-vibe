import { mkdirSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const dataDir = ".data";
const url = "file:./.data/dev.sqlite";
mkdirSync(dataDir, { recursive: true });

export const client = createClient({ url });
export const db = drizzle(client);
