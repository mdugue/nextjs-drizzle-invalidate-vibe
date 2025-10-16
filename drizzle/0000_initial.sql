CREATE TABLE IF NOT EXISTS "projects" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'planned' NOT NULL,
  "owner" text,
  "created_at" integer DEFAULT (unixepoch()) NOT NULL,
  "updated_at" integer DEFAULT (unixepoch()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "tickets" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "summary" text,
  "status" text DEFAULT 'todo' NOT NULL,
  "project_id" integer,
  "assignee" text,
  "created_at" integer DEFAULT (unixepoch()) NOT NULL,
  "updated_at" integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "members" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "status" text DEFAULT 'invited' NOT NULL,
  "bio" text,
  "role" text,
  "created_at" integer DEFAULT (unixepoch()) NOT NULL,
  "updated_at" integer DEFAULT (unixepoch()) NOT NULL
);
