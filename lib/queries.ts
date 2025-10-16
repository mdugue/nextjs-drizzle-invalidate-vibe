import { unstable_cache } from "next/cache";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  like,
  lt,
  or,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  members,
  projects,
  tickets,
  type Member,
  type Project,
  type Ticket,
} from "@/lib/schema";
import { cursorPaginate, type CursorPaginationParams } from "@/lib/pagination";

export const PROJECT_LIST_TAG = "projects:list";
export const PROJECT_DETAIL_TAG = (id: number) => `projects:detail:${id}`;
export const TICKET_LIST_TAG = "tickets:list";
export const TICKET_DETAIL_TAG = (id: number) => `tickets:detail:${id}`;
export const MEMBER_LIST_TAG = "members:list";
export const MEMBER_DETAIL_TAG = (id: number) => `members:detail:${id}`;

type SortOption = "createdAt" | "title";

function encodeCursor(primary: string | number, secondary: number) {
  return `${encodeURIComponent(String(primary))}::${secondary}`;
}

function decodeCursor(cursor: string) {
  const [primary, secondary] = cursor.split("::");
  return { primary: decodeURIComponent(primary), secondary: Number.parseInt(secondary ?? "0", 10) };
}

type ListParams = CursorPaginationParams<string> & {
  search?: string;
  sort?: SortOption;
};

const projectFetcher = async (params: ListParams) => {
  const { cursor, direction = "forward", search, limit = 20, sort = "createdAt" } = params;

  const where = [] as any[];
  if (search) {
    const pattern = `%${search.toLowerCase()}%`;
    where.push(
      or(
        like(projects.title, pattern),
        like(projects.slug, pattern),
        like(projects.owner, pattern),
      ),
    );
  }

  const conditions = [...where];
  if (cursor) {
    const { primary, secondary } = decodeCursor(cursor);
    if (sort === "createdAt") {
      const value = Number(primary);
      const comparator = direction === "forward" ? lt : gt;
      const tieComparator = direction === "forward" ? lt : gt;
      conditions.push(
        or(
          comparator(projects.createdAt, value),
          and(eq(projects.createdAt, value), tieComparator(projects.id, secondary)),
        ),
      );
    } else {
      const value = String(primary);
      const comparator = direction === "forward" ? lt : gt;
      const tieComparator = direction === "forward" ? lt : gt;
      conditions.push(
        or(
          comparator(projects.title, value),
          and(eq(projects.title, value), tieComparator(projects.id, secondary)),
        ),
      );
    }
  }

  const orderBy =
    sort === "createdAt"
      ? direction === "forward"
        ? [desc(projects.createdAt), desc(projects.id)]
        : [asc(projects.createdAt), asc(projects.id)]
      : direction === "forward"
        ? [asc(projects.title), asc(projects.id)]
        : [desc(projects.title), desc(projects.id)];

  const rows = await db
    .select()
    .from(projects)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderBy)
    .limit(limit);

  return rows;
};

const projectList = unstable_cache(
  async (params: ListParams) => {
    const result = await cursorPaginate<Project, string>({
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit ?? 20,
      fetcher: async (fetchParams) => {
        return projectFetcher({ ...params, ...fetchParams });
      },
      getCursor: (item) =>
        params.sort === "title"
          ? encodeCursor(item.title ?? "", item.id)
          : encodeCursor(item.createdAt, item.id),
    });
    return result;
  },
  ["projects"],
  { tags: [PROJECT_LIST_TAG] },
);

export const getProjectList = (params: ListParams) => projectList(params);

export async function getProjectDetail(id: number) {
  const detail = unstable_cache(
    async () => {
      const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      return project ?? null;
    },
    ["projects", "detail", String(id)],
    { tags: [PROJECT_DETAIL_TAG(id)] },
  );
  return detail();
}

const ticketFetcher = async (
  params: ListParams & {
    projectId?: number;
  },
) => {
  const { cursor, direction = "forward", search, limit = 20, sort = "createdAt", projectId } = params;

  const where = [] as any[];
  if (search) {
    const pattern = `%${search.toLowerCase()}%`;
    where.push(
      or(
        like(tickets.title, pattern),
        like(tickets.slug, pattern),
        like(tickets.assignee, pattern),
      ),
    );
  }
  if (projectId) {
    where.push(eq(tickets.projectId, projectId));
  }

  const conditions = [...where];
  if (cursor) {
    const { primary, secondary } = decodeCursor(cursor);
    if (sort === "createdAt") {
      const value = Number(primary);
      const comparator = direction === "forward" ? lt : gt;
      const tieComparator = direction === "forward" ? lt : gt;
      conditions.push(
        or(
          comparator(tickets.createdAt, value),
          and(eq(tickets.createdAt, value), tieComparator(tickets.id, secondary)),
        ),
      );
    } else {
      const value = String(primary);
      const comparator = direction === "forward" ? lt : gt;
      const tieComparator = direction === "forward" ? lt : gt;
      conditions.push(
        or(
          comparator(tickets.title, value),
          and(eq(tickets.title, value), tieComparator(tickets.id, secondary)),
        ),
      );
    }
  }

  const orderBy =
    sort === "createdAt"
      ? direction === "forward"
        ? [desc(tickets.createdAt), desc(tickets.id)]
        : [asc(tickets.createdAt), asc(tickets.id)]
      : direction === "forward"
        ? [asc(tickets.title), asc(tickets.id)]
        : [desc(tickets.title), desc(tickets.id)];

  return db
    .select()
    .from(tickets)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderBy)
    .limit(limit);
};

const ticketList = unstable_cache(
  async (params: ListParams & { projectId?: number }) => {
    const result = await cursorPaginate<Ticket, string>({
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit ?? 20,
      fetcher: async (fetchParams) => ticketFetcher({ ...params, ...fetchParams }),
      getCursor: (item) =>
        params.sort === "title"
          ? encodeCursor(item.title ?? "", item.id)
          : encodeCursor(item.createdAt, item.id),
    });
    return result;
  },
  ["tickets"],
  { tags: [TICKET_LIST_TAG] },
);

export const getTicketList = (params: ListParams & { projectId?: number }) => ticketList(params);

export async function getTicketDetail(id: number) {
  const detail = unstable_cache(
    async () => {
      const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
      return ticket ?? null;
    },
    ["tickets", "detail", String(id)],
    { tags: [TICKET_DETAIL_TAG(id)] },
  );
  return detail();
}

const memberFetcher = async (params: ListParams) => {
  const { cursor, direction = "forward", search, limit = 20, sort = "createdAt" } = params;
  const where = [] as any[];
  if (search) {
    const pattern = `%${search.toLowerCase()}%`;
    where.push(
      or(
        like(members.name, pattern),
        like(members.email, pattern),
        like(members.slug, pattern),
      ),
    );
  }

  const conditions = [...where];
  if (cursor) {
    const { primary, secondary } = decodeCursor(cursor);
    if (sort === "createdAt") {
      const value = Number(primary);
      const comparator = direction === "forward" ? lt : gt;
      const tieComparator = direction === "forward" ? lt : gt;
      conditions.push(
        or(
          comparator(members.createdAt, value),
          and(eq(members.createdAt, value), tieComparator(members.id, secondary)),
        ),
      );
    } else {
      const value = String(primary);
      const comparator = direction === "forward" ? lt : gt;
      const tieComparator = direction === "forward" ? lt : gt;
      conditions.push(
        or(
          comparator(members.name, value),
          and(eq(members.name, value), tieComparator(members.id, secondary)),
        ),
      );
    }
  }

  const orderBy =
    sort === "createdAt"
      ? direction === "forward"
        ? [desc(members.createdAt), desc(members.id)]
        : [asc(members.createdAt), asc(members.id)]
      : direction === "forward"
        ? [asc(members.name), asc(members.id)]
        : [desc(members.name), desc(members.id)];

  return db
    .select()
    .from(members)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderBy)
    .limit(limit);
};

const memberList = unstable_cache(
  async (params: ListParams) => {
    const result = await cursorPaginate<Member, string>({
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit ?? 20,
      fetcher: async (fetchParams) => memberFetcher({ ...params, ...fetchParams }),
      getCursor: (item) =>
        params.sort === "title"
          ? encodeCursor(item.name ?? "", item.id)
          : encodeCursor(item.createdAt, item.id),
    });
    return result;
  },
  ["members"],
  { tags: [MEMBER_LIST_TAG] },
);

export const getMemberList = (params: ListParams) => memberList(params);

export async function getMemberDetail(id: number) {
  const detail = unstable_cache(
    async () => {
      const [member] = await db.select().from(members).where(eq(members.id, id)).limit(1);
      return member ?? null;
    },
    ["members", "detail", String(id)],
    { tags: [MEMBER_DETAIL_TAG(id)] },
  );
  return detail();
}

const projectOptionsCache = unstable_cache(
  async () => {
    return db.select({ id: projects.id, title: projects.title }).from(projects).orderBy(asc(projects.title));
  },
  ["project-options"],
  { tags: [PROJECT_LIST_TAG] },
);

export const getProjectOptions = () => projectOptionsCache();

const memberOptionsCache = unstable_cache(
  async () => {
    return db.select({ id: members.id, name: members.name }).from(members).orderBy(asc(members.name));
  },
  ["member-options"],
  { tags: [MEMBER_LIST_TAG] },
);

export const getMemberOptions = () => memberOptionsCache();
