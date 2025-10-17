import type { AnyColumn, SQL } from "drizzle-orm";
import { and, asc, desc, eq, gt, like, lt, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import {
  type CursorPaginationParams,
  cursorPaginate,
  type PaginationDirection,
} from "@/lib/pagination";
import {
  type Member,
  members,
  type Project,
  projects,
  type Ticket,
  tickets,
} from "@/lib/schema";

export const PROJECT_LIST_TAG = "projects:list";
export const PROJECT_DETAIL_TAG = (id: number) => `projects:detail:${id}`;
export const TICKET_LIST_TAG = "tickets:list";
export const TICKET_DETAIL_TAG = (id: number) => `tickets:detail:${id}`;
export const MEMBER_LIST_TAG = "members:list";
export const MEMBER_DETAIL_TAG = (id: number) => `members:detail:${id}`;

type SortOption = "createdAt" | "title";

function encodeCursor(primary: Date | string | number, secondary: number) {
  const serialized =
    primary instanceof Date ? primary.toISOString() : String(primary);
  return `${encodeURIComponent(serialized)}::${secondary}`;
}

function decodeCursor(cursor: string) {
  const [primary, secondary] = cursor.split("::");
  return {
    primary: decodeURIComponent(primary ?? ""),
    secondary: Number.parseInt(secondary ?? "0", 10),
  };
}

const isSql = (value: SQL<unknown> | undefined): value is SQL<unknown> =>
  value !== undefined;

const DEFAULT_LIST_LIMIT = 20;

type SearchBuilder = (pattern: string) => SQL<unknown> | undefined;

function appendSearchConditions(
  where: SQL<unknown>[],
  search: string | undefined,
  builders: SearchBuilder[]
) {
  if (!search) {
    return;
  }
  const pattern = `%${search.toLowerCase()}%`;
  const searchConditions = builders
    .map((builder) => builder(pattern))
    .filter(isSql);
  if (searchConditions.length === 0) {
    return;
  }
  if (searchConditions.length === 1) {
    where.push(searchConditions[0]);
    return;
  }
  const combined = or(...searchConditions);
  if (combined) {
    where.push(combined);
  }
}

type CursorConditionConfig = {
  cursor?: string;
  direction: PaginationDirection;
  sort: SortOption;
  dateColumn: AnyColumn;
  textColumn: AnyColumn;
  idColumn: AnyColumn;
};

function pushCursorConditions(
  where: SQL<unknown>[],
  primaryCondition: SQL<unknown> | undefined,
  tieCondition: SQL<unknown> | undefined
) {
  if (primaryCondition && tieCondition) {
    const combined = or(primaryCondition, tieCondition);
    if (combined) {
      where.push(combined);
      return;
    }
  }
  if (primaryCondition) {
    where.push(primaryCondition);
    return;
  }
  if (tieCondition) {
    where.push(tieCondition);
  }
}

function appendCursorConditions(
  where: SQL<unknown>[],
  {
    cursor,
    direction,
    sort,
    dateColumn,
    textColumn,
    idColumn,
  }: CursorConditionConfig
) {
  if (!cursor) {
    return;
  }
  const { primary, secondary } = decodeCursor(cursor);
  const comparator = direction === "forward" ? lt : gt;
  const tieComparator = direction === "forward" ? lt : gt;

  if (sort === "createdAt") {
    const value = new Date(primary);
    if (Number.isNaN(value.getTime())) {
      return;
    }
    const primaryCondition = comparator(dateColumn, value);
    const tieCondition = and(
      eq(dateColumn, value),
      tieComparator(idColumn, secondary)
    );
    pushCursorConditions(where, primaryCondition, tieCondition);
    return;
  }

  const value = String(primary);
  const primaryCondition = comparator(textColumn, value);
  const tieCondition = and(
    eq(textColumn, value),
    tieComparator(idColumn, secondary)
  );
  pushCursorConditions(where, primaryCondition, tieCondition);
}

type OrderByConfig = {
  direction: PaginationDirection;
  sort: SortOption;
  dateColumn: AnyColumn;
  textColumn: AnyColumn;
  idColumn: AnyColumn;
};

function resolveOrderBy({
  direction,
  sort,
  dateColumn,
  textColumn,
  idColumn,
}: OrderByConfig) {
  if (sort === "createdAt") {
    return direction === "forward"
      ? [desc(dateColumn), desc(idColumn)]
      : [asc(dateColumn), asc(idColumn)];
  }

  return direction === "forward"
    ? [asc(textColumn), asc(idColumn)]
    : [desc(textColumn), desc(idColumn)];
}

type ListParams = CursorPaginationParams<string> & {
  search?: string;
  sort?: SortOption;
};

const projectFetcher = (params: ListParams) => {
  const {
    cursor,
    direction = "forward",
    search,
    limit = DEFAULT_LIST_LIMIT,
    sort = "createdAt",
  } = params;

  const where: SQL<unknown>[] = [];

  appendSearchConditions(where, search, [
    (pattern) => like(projects.title, pattern),
    (pattern) => like(projects.slug, pattern),
    (pattern) => like(projects.owner, pattern),
  ]);

  appendCursorConditions(where, {
    cursor,
    direction,
    sort,
    dateColumn: projects.createdAt,
    textColumn: projects.title,
    idColumn: projects.id,
  });

  const query = where.length
    ? db
        .select()
        .from(projects)
        .where(and(...where))
    : db.select().from(projects);

  const orderBy = resolveOrderBy({
    direction,
    sort,
    dateColumn: projects.createdAt,
    textColumn: projects.title,
    idColumn: projects.id,
  });

  return query.orderBy(...orderBy).limit(limit);
};

const projectList = unstable_cache(
  async (params: ListParams) => {
    const result = await cursorPaginate<Project, string>({
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit ?? DEFAULT_LIST_LIMIT,
      fetcher: async (fetchParams) =>
        projectFetcher({ ...params, ...fetchParams }),
      getCursor: (item) =>
        params.sort === "title"
          ? encodeCursor(item.title ?? "", item.id)
          : encodeCursor(item.createdAt, item.id),
    });
    return result;
  },
  ["projects"],
  { tags: [PROJECT_LIST_TAG] }
);

export const getProjectList = (params: ListParams) => projectList(params);

export async function getProjectDetail(id: number) {
  const detail = await unstable_cache(
    async () => {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);
      return project ?? null;
    },
    ["projects", "detail", String(id)],
    { tags: [PROJECT_DETAIL_TAG(id)] }
  );
  return detail();
}

const ticketFetcher = (
  params: ListParams & {
    projectId?: number;
  }
) => {
  const {
    cursor,
    direction = "forward",
    search,
    limit = DEFAULT_LIST_LIMIT,
    sort = "createdAt",
    projectId,
  } = params;

  const where: SQL<unknown>[] = [];

  appendSearchConditions(where, search, [
    (pattern) => like(tickets.title, pattern),
    (pattern) => like(tickets.slug, pattern),
    (pattern) => like(tickets.assignee, pattern),
  ]);

  if (projectId) {
    where.push(eq(tickets.projectId, projectId));
  }

  appendCursorConditions(where, {
    cursor,
    direction,
    sort,
    dateColumn: tickets.createdAt,
    textColumn: tickets.title,
    idColumn: tickets.id,
  });

  const query = where.length
    ? db
        .select()
        .from(tickets)
        .where(and(...where))
    : db.select().from(tickets);

  const orderBy = resolveOrderBy({
    direction,
    sort,
    dateColumn: tickets.createdAt,
    textColumn: tickets.title,
    idColumn: tickets.id,
  });

  return query.orderBy(...orderBy).limit(limit);
};

const ticketList = unstable_cache(
  async (params: ListParams & { projectId?: number }) => {
    const result = await cursorPaginate<Ticket, string>({
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit ?? DEFAULT_LIST_LIMIT,
      fetcher: async (fetchParams) =>
        ticketFetcher({ ...params, ...fetchParams }),
      getCursor: (item) =>
        params.sort === "title"
          ? encodeCursor(item.title ?? "", item.id)
          : encodeCursor(item.createdAt, item.id),
    });
    return result;
  },
  ["tickets"],
  { tags: [TICKET_LIST_TAG] }
);

export const getTicketList = (params: ListParams & { projectId?: number }) =>
  ticketList(params);

export async function getTicketDetail(id: number) {
  const detail = await unstable_cache(
    async () => {
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, id))
        .limit(1);
      return ticket ?? null;
    },
    ["tickets", "detail", String(id)],
    { tags: [TICKET_DETAIL_TAG(id)] }
  );
  return detail();
}

const memberFetcher = (params: ListParams) => {
  const {
    cursor,
    direction = "forward",
    search,
    limit = DEFAULT_LIST_LIMIT,
    sort = "createdAt",
  } = params;
  const where: SQL<unknown>[] = [];

  appendSearchConditions(where, search, [
    (pattern) => like(members.name, pattern),
    (pattern) => like(members.email, pattern),
    (pattern) => like(members.slug, pattern),
  ]);

  appendCursorConditions(where, {
    cursor,
    direction,
    sort,
    dateColumn: members.createdAt,
    textColumn: members.name,
    idColumn: members.id,
  });

  const query = where.length
    ? db
        .select()
        .from(members)
        .where(and(...where))
    : db.select().from(members);

  const orderBy = resolveOrderBy({
    direction,
    sort,
    dateColumn: members.createdAt,
    textColumn: members.name,
    idColumn: members.id,
  });

  return query.orderBy(...orderBy).limit(limit);
};

const memberList = unstable_cache(
  async (params: ListParams) => {
    const result = await cursorPaginate<Member, string>({
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit ?? DEFAULT_LIST_LIMIT,
      fetcher: async (fetchParams) =>
        memberFetcher({ ...params, ...fetchParams }),
      getCursor: (item) =>
        params.sort === "title"
          ? encodeCursor(item.name ?? "", item.id)
          : encodeCursor(item.createdAt, item.id),
    });
    return result;
  },
  ["members"],
  { tags: [MEMBER_LIST_TAG] }
);

export const getMemberList = (params: ListParams) => memberList(params);

export async function getMemberDetail(id: number) {
  const detail = await unstable_cache(
    async () => {
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.id, id))
        .limit(1);
      return member ?? null;
    },
    ["members", "detail", String(id)],
    { tags: [MEMBER_DETAIL_TAG(id)] }
  );
  return detail();
}

const projectOptionsCache = unstable_cache(
  async () =>
    db
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .orderBy(asc(projects.title)),
  ["project-options"],
  { tags: [PROJECT_LIST_TAG] }
);

export const getProjectOptions = () => projectOptionsCache();

const memberOptionsCache = unstable_cache(
  async () =>
    db
      .select({ id: members.id, name: members.name })
      .from(members)
      .orderBy(asc(members.name)),
  ["member-options"],
  { tags: [MEMBER_LIST_TAG] }
);

export const getMemberOptions = () => memberOptionsCache();
