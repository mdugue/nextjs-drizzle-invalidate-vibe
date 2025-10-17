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

const versionFields = {
  entityId: integer("entity_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  changedAt: integer("changed_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
};

const projectFields = {
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: projectStatus }).notNull(),
  owner: text("owner"),
};

const ticketFields = {
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  status: text("status", { enum: ticketStatus }).notNull(),
  projectId: integer("project_id"),
  assignee: text("assignee"),
};

const memberFields = {
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  status: text("status", { enum: memberStatus }).notNull(),
  bio: text("bio"),
  role: text("role"),
};

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ...projectFields,
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: projectStatus }).notNull().default("planned"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  ...timestamps,
});

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ...ticketFields,
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: ticketStatus }).notNull().default("todo"),
  projectId: integer("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  ...timestamps,
});

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ...memberFields,
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: memberStatus }).notNull().default("invited"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  ...timestamps,
});

export const projectsHistory = sqliteTable("projects_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ...versionFields,
  entityId: integer("entity_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  ...projectFields,
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const ticketsHistory = sqliteTable("tickets_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ...versionFields,
  entityId: integer("entity_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  ...ticketFields,
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const membersHistory = sqliteTable("members_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ...versionFields,
  entityId: integer("entity_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  ...memberFields,
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const projectRelations = relations(projects, ({ many }) => ({
  tickets: many(tickets),
  history: many(projectsHistory),
}));

export const ticketRelations = relations(tickets, ({ one, many }) => ({
  project: one(projects, {
    fields: [tickets.projectId],
    references: [projects.id],
  }),
  history: many(ticketsHistory),
}));

export const memberRelations = relations(members, ({ many }) => ({
  history: many(membersHistory),
}));

export const projectsHistoryRelations = relations(
  projectsHistory,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectsHistory.entityId],
      references: [projects.id],
    }),
  })
);

export const ticketsHistoryRelations = relations(ticketsHistory, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketsHistory.entityId],
    references: [tickets.id],
  }),
}));

export const membersHistoryRelations = relations(membersHistory, ({ one }) => ({
  member: one(members, {
    fields: [membersHistory.entityId],
    references: [members.id],
  }),
}));

export type Project = typeof projects.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Member = typeof members.$inferSelect;
export type ProjectHistory = typeof projectsHistory.$inferSelect;
export type TicketHistory = typeof ticketsHistory.$inferSelect;
export type MemberHistory = typeof membersHistory.$inferSelect;
