import { and, desc, eq, max } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  type Member,
  type MemberHistory,
  members,
  membersHistory,
  type Project,
  type ProjectHistory,
  projects,
  projectsHistory,
  type Ticket,
  type TicketHistory,
  tickets,
  ticketsHistory,
} from "@/lib/schema";

export type EntityType = "project" | "ticket" | "member";

export type VersionMetadata = {
  versionNumber: number;
  changedAt: Date;
};

export type FieldDiff = {
  field: string;
  oldValue: unknown;
  newValue: unknown;
};

export type VersionDiff = {
  changes: FieldDiff[];
  metadata: {
    fromVersion: number;
    toVersion: number;
  };
};

// Table configuration map
const ENTITY_CONFIG = {
  project: {
    table: projects,
    historyTable: projectsHistory,
  },
  ticket: {
    table: tickets,
    historyTable: ticketsHistory,
  },
  member: {
    table: members,
    historyTable: membersHistory,
  },
} as const;

async function getNextVersionNumber(
  entityType: EntityType,
  entityId: number
): Promise<number> {
  const { historyTable } = ENTITY_CONFIG[entityType];

  const result = await db
    .select({ maxVersion: max(historyTable.versionNumber) })
    .from(historyTable)
    .where(eq(historyTable.entityId, entityId))
    .limit(1);

  const currentMax = result[0]?.maxVersion;
  return currentMax ? currentMax + 1 : 1;
}

export async function createProjectVersion(
  entityId: number,
  data: Omit<Project, "id" | "deletedAt">
): Promise<void> {
  const versionNumber = await getNextVersionNumber("project", entityId);

  await db.insert(projectsHistory).values({
    entityId,
    versionNumber,
    changedAt: new Date(),
    slug: data.slug,
    title: data.title,
    description: data.description ?? null,
    status: data.status,
    owner: data.owner ?? null,
    createdAt: data.createdAt,
  });
}

export async function createTicketVersion(
  entityId: number,
  data: Omit<Ticket, "id" | "deletedAt">
): Promise<void> {
  const versionNumber = await getNextVersionNumber("ticket", entityId);

  await db.insert(ticketsHistory).values({
    entityId,
    versionNumber,
    changedAt: new Date(),
    slug: data.slug,
    title: data.title,
    summary: data.summary ?? null,
    status: data.status,
    projectId: data.projectId ?? null,
    assignee: data.assignee ?? null,
    createdAt: data.createdAt,
  });
}

export async function createMemberVersion(
  entityId: number,
  data: Omit<Member, "id" | "deletedAt">
): Promise<void> {
  const versionNumber = await getNextVersionNumber("member", entityId);

  await db.insert(membersHistory).values({
    entityId,
    versionNumber,
    changedAt: new Date(),
    slug: data.slug,
    name: data.name,
    email: data.email,
    status: data.status,
    bio: data.bio ?? null,
    role: data.role ?? null,
    createdAt: data.createdAt,
  });
}

// Generic function to get version history
function getVersionHistory<T>(
  // biome-ignore lint/suspicious/noExplicitAny: Generic table type needed for flexibility
  historyTable: any,
  entityId: number
): Promise<T[]> {
  return db
    .select()
    .from(historyTable)
    .where(eq(historyTable.entityId, entityId))
    .orderBy(desc(historyTable.versionNumber)) as Promise<T[]>;
}

export function getProjectVersions(
  entityId: number
): Promise<ProjectHistory[]> {
  return getVersionHistory<ProjectHistory>(projectsHistory, entityId);
}

export function getTicketVersions(entityId: number): Promise<TicketHistory[]> {
  return getVersionHistory<TicketHistory>(ticketsHistory, entityId);
}

export function getMemberVersions(entityId: number): Promise<MemberHistory[]> {
  return getVersionHistory<MemberHistory>(membersHistory, entityId);
}

export async function getVersionCount(
  entityType: EntityType,
  entityId: number
): Promise<number> {
  const { historyTable } = ENTITY_CONFIG[entityType];

  const result = await db
    .select({ count: max(historyTable.versionNumber) })
    .from(historyTable)
    .where(eq(historyTable.entityId, entityId))
    .limit(1);

  return result[0]?.count ?? 0;
}

// Generic function to get a specific version
async function getVersion<T>(
  // biome-ignore lint/suspicious/noExplicitAny: Generic table type needed for flexibility
  historyTable: any,
  entityId: number,
  versionNumber: number
): Promise<T | null> {
  const result = await db
    .select()
    .from(historyTable)
    .where(
      and(
        eq(historyTable.entityId, entityId),
        eq(historyTable.versionNumber, versionNumber)
      )
    )
    .limit(1);

  return (result[0] as T) ?? null;
}

export function getProjectVersion(
  entityId: number,
  versionNumber: number
): Promise<ProjectHistory | null> {
  return getVersion<ProjectHistory>(projectsHistory, entityId, versionNumber);
}

export function getTicketVersion(
  entityId: number,
  versionNumber: number
): Promise<TicketHistory | null> {
  return getVersion<TicketHistory>(ticketsHistory, entityId, versionNumber);
}

export function getMemberVersion(
  entityId: number,
  versionNumber: number
): Promise<MemberHistory | null> {
  return getVersion<MemberHistory>(membersHistory, entityId, versionNumber);
}

function compareFields<T extends Record<string, unknown>>(
  oldData: T,
  newData: T,
  fields: (keyof T)[]
): FieldDiff[] {
  const changes: FieldDiff[] = [];

  for (const field of fields) {
    const oldValue = oldData[field];
    const newValue = newData[field];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: String(field),
        oldValue,
        newValue,
      });
    }
  }

  return changes;
}

// Generic version comparison
async function compareVersions<T extends Record<string, unknown>>(options: {
  getVersionFn: (id: number, version: number) => Promise<T | null>;
  entityId: number;
  fromVersion: number;
  toVersion: number;
  fields: (keyof T)[];
}): Promise<VersionDiff | null> {
  const { getVersionFn, entityId, fromVersion, toVersion, fields } = options;

  const [oldVer, newVer] = await Promise.all([
    getVersionFn(entityId, fromVersion),
    getVersionFn(entityId, toVersion),
  ]);

  if (!oldVer) {
    return null;
  }
  if (!newVer) {
    return null;
  }

  const changes = compareFields(oldVer, newVer, fields);

  return {
    changes,
    metadata: { fromVersion, toVersion },
  };
}

export function compareProjectVersions(
  entityId: number,
  fromVersion: number,
  toVersion: number
): Promise<VersionDiff | null> {
  return compareVersions({
    getVersionFn: getProjectVersion,
    entityId,
    fromVersion,
    toVersion,
    fields: ["slug", "title", "description", "status", "owner"],
  });
}

export function compareTicketVersions(
  entityId: number,
  fromVersion: number,
  toVersion: number
): Promise<VersionDiff | null> {
  return compareVersions({
    getVersionFn: getTicketVersion,
    entityId,
    fromVersion,
    toVersion,
    fields: ["slug", "title", "summary", "status", "projectId", "assignee"],
  });
}

export function compareMemberVersions(
  entityId: number,
  fromVersion: number,
  toVersion: number
): Promise<VersionDiff | null> {
  return compareVersions({
    getVersionFn: getMemberVersion,
    entityId,
    fromVersion,
    toVersion,
    fields: ["slug", "name", "email", "status", "bio", "role"],
  });
}

export async function restoreProjectVersion(
  entityId: number,
  versionNumber: number
): Promise<void> {
  const version = await getProjectVersion(entityId, versionNumber);
  if (!version) {
    throw new Error("Version not found");
  }

  const [current] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, entityId))
    .limit(1);

  if (current) {
    await createProjectVersion(entityId, current);
  }

  await db
    .update(projects)
    .set({
      slug: version.slug,
      title: version.title,
      description: version.description,
      status: version.status,
      owner: version.owner,
      updatedAt: new Date(),
      deletedAt: null,
    })
    .where(eq(projects.id, entityId));
}

export async function restoreTicketVersion(
  entityId: number,
  versionNumber: number
): Promise<void> {
  const version = await getTicketVersion(entityId, versionNumber);
  if (!version) {
    throw new Error("Version not found");
  }

  const [current] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, entityId))
    .limit(1);

  if (current) {
    await createTicketVersion(entityId, current);
  }

  await db
    .update(tickets)
    .set({
      slug: version.slug,
      title: version.title,
      summary: version.summary,
      status: version.status,
      projectId: version.projectId,
      assignee: version.assignee,
      updatedAt: new Date(),
      deletedAt: null,
    })
    .where(eq(tickets.id, entityId));
}

export async function restoreMemberVersion(
  entityId: number,
  versionNumber: number
): Promise<void> {
  const version = await getMemberVersion(entityId, versionNumber);
  if (!version) {
    throw new Error("Version not found");
  }

  const [current] = await db
    .select()
    .from(members)
    .where(eq(members.id, entityId))
    .limit(1);

  if (current) {
    await createMemberVersion(entityId, current);
  }

  await db
    .update(members)
    .set({
      slug: version.slug,
      name: version.name,
      email: version.email,
      status: version.status,
      bio: version.bio,
      role: version.role,
      updatedAt: new Date(),
      deletedAt: null,
    })
    .where(eq(members.id, entityId));
}
