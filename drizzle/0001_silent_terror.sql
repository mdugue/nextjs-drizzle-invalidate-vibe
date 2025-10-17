CREATE TABLE `members_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_id` integer NOT NULL,
	`version_number` integer NOT NULL,
	`changed_at` integer DEFAULT '"2025-10-17T11:41:38.955Z"' NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`status` text NOT NULL,
	`bio` text,
	`role` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`entity_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_id` integer NOT NULL,
	`version_number` integer NOT NULL,
	`changed_at` integer DEFAULT '"2025-10-17T11:41:38.955Z"' NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text NOT NULL,
	`owner` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`entity_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tickets_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_id` integer NOT NULL,
	`version_number` integer NOT NULL,
	`changed_at` integer DEFAULT '"2025-10-17T11:41:38.955Z"' NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`status` text NOT NULL,
	`project_id` integer,
	`assignee` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`entity_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`bio` text,
	`role` text,
	`deleted_at` integer,
	`created_at` integer DEFAULT '"2025-10-17T11:41:38.954Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-10-17T11:41:38.954Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_members`("id", "slug", "name", "email", "status", "bio", "role", "created_at", "updated_at") SELECT "id", "slug", "name", "email", "status", "bio", "role", "created_at", "updated_at" FROM `members`;--> statement-breakpoint
DROP TABLE `members`;--> statement-breakpoint
ALTER TABLE `__new_members` RENAME TO `members`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `members_slug_unique` ON `members` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'planned' NOT NULL,
	`owner` text,
	`deleted_at` integer,
	`created_at` integer DEFAULT '"2025-10-17T11:41:38.954Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-10-17T11:41:38.954Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "slug", "title", "description", "status", "owner", "created_at", "updated_at") SELECT "id", "slug", "title", "description", "status", "owner", "created_at", "updated_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`project_id` integer,
	`assignee` text,
	`deleted_at` integer,
	`created_at` integer DEFAULT '"2025-10-17T11:41:38.954Z"' NOT NULL,
	`updated_at` integer DEFAULT '"2025-10-17T11:41:38.954Z"' NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_tickets`("id", "slug", "title", "summary", "status", "project_id", "assignee", "created_at", "updated_at") SELECT "id", "slug", "title", "summary", "status", "project_id", "assignee", "created_at", "updated_at" FROM `tickets`;--> statement-breakpoint
DROP TABLE `tickets`;--> statement-breakpoint
ALTER TABLE `__new_tickets` RENAME TO `tickets`;--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_slug_unique` ON `tickets` (`slug`);