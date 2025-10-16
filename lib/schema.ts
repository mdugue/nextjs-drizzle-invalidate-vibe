import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projectStatus = [
  "planned",
  "active",
  "paused",
  "complete",
] as const;
export const ticketStatus = ["todo", "in-progress", "blocked", "done"] as const;
export const memberStatus = [
  "invited",
  "active",
  "sabbatical",
  "inactive",
] as const;

export type ProjectStatus = (typeof projectStatus)[number];
export type TicketStatus = (typeof ticketStatus)[number];
export type MemberStatus = (typeof memberStatus)[number];

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(new Date())
    .$onUpdate(() => new Date()),
};

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: projectStatus }).notNull().default("planned"),
  owner: text("owner"),
  ...timestamps,
});

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  status: text("status", { enum: ticketStatus }).notNull().default("todo"),
  projectId: integer("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  assignee: text("assignee"),
  ...timestamps,
});

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  status: text("status", { enum: memberStatus }).notNull().default("invited"),
  bio: text("bio"),
  role: text("role"),
  ...timestamps,
});

export const projectRelations = relations(projects, ({ many }) => ({
  tickets: many(tickets),
}));

export const ticketRelations = relations(tickets, ({ one }) => ({
  project: one(projects, {
    fields: [tickets.projectId],
    references: [projects.id],
  }),
}));

export type Project = typeof projects.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Member = typeof members.$inferSelect;
