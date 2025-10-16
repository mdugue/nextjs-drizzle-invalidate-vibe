import type { SQL } from "drizzle-orm";
import { and, asc, desc, eq, gt, like, lt, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import {
  type CursorPaginationParams,
  cursorPaginate,
  DEFAULT_PAGE_SIZE,
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

const DEFAULT_DIRECTION: PaginationDirection = "forward";

type SearchableColumn = Parameters<typeof like>[0];
type OrderableColumn = Parameters<typeof asc>[0];
type ComparableColumn = Parameters<typeof eq>[0];

function addSearchFilters(
  where: SQL<unknown>[],
  search: string | undefined,
  columns: SearchableColumn[]
) {
  if (!search) {
    return;
  }
  const pattern = `%${search.toLowerCase()}%`;
  const searchConditions = columns.map((column) => like(column, pattern));
  if (!searchConditions.length) {
    return;
  }
  const combined =
    searchConditions.length === 1
      ? searchConditions[0]
      : or(...searchConditions);
  if (combined) {
    where.push(combined);
  }
}

type CursorConditionConfig = {
  cursor?: string;
  direction: PaginationDirection;
  sort: SortOption;
  createdAtColumn: ComparableColumn;
  textColumn: ComparableColumn;
  idColumn: ComparableColumn;
};

function buildCursorCondition({
  cursor,
  direction,
  sort,
  createdAtColumn,
  textColumn,
  idColumn,
}: CursorConditionConfig) {
  if (!cursor) {
    return;
  }
  const { primary, secondary } = decodeCursor(cursor);
  const comparator = direction === "forward" ? lt : gt;
  if (sort === "createdAt") {
    const timestamp = new Date(primary);
    if (Number.isNaN(timestamp.getTime())) {
      return;
    }
    const primaryCondition = comparator(createdAtColumn, timestamp);
    const tieCondition = and(
      eq(createdAtColumn, timestamp),
      comparator(idColumn, secondary)
    );
    return or(primaryCondition, tieCondition);
  }
  const value = String(primary);
  const primaryCondition = comparator(textColumn, value);
  const tieCondition = and(
    eq(textColumn, value),
    comparator(idColumn, secondary)
  );
  return or(primaryCondition, tieCondition);
}

type OrderConfig = {
  direction: PaginationDirection;
  sort: SortOption;
  createdAtColumn: OrderableColumn;
  textColumn: OrderableColumn;
  idColumn: OrderableColumn;
};

function buildOrderBy({
  direction,
  sort,
  createdAtColumn,
  textColumn,
  idColumn,
}: OrderConfig) {
  const isForward = direction === "forward";
  if (sort === "createdAt") {
    return isForward
      ? [desc(createdAtColumn), desc(idColumn)]
      : [asc(createdAtColumn), asc(idColumn)];
  }
  return isForward
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
    direction = DEFAULT_DIRECTION,
    search,
    limit = DEFAULT_PAGE_SIZE,
    sort = "createdAt",
  } = params;

  const conditions: SQL<unknown>[] = [];
  addSearchFilters(conditions, search, [
    projects.title,
    projects.slug,
    projects.owner,
  ]);

  const cursorCondition = buildCursorCondition({
    cursor,
    direction,
    sort,
    createdAtColumn: projects.createdAt,
    textColumn: projects.title,
    idColumn: projects.id,
  });
  if (cursorCondition) {
    conditions.push(cursorCondition);
  }

  const baseQuery = db.select().from(projects);
  const filteredQuery = conditions.length
    ? baseQuery.where(and(...conditions))
    : baseQuery;

  return filteredQuery
    .orderBy(
      ...buildOrderBy({
        direction,
        sort,
        createdAtColumn: projects.createdAt,
        textColumn: projects.title,
        idColumn: projects.id,
      })
    )
    .limit(limit);
};

const projectList = unstable_cache(
  async (params: ListParams) => {
    const result = await cursorPaginate<Project, string>({
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit ?? DEFAULT_PAGE_SIZE,
      fetcher: (fetchParams) => projectFetcher({ ...params, ...fetchParams }),
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

export function getProjectDetail(id: number) {
  const detail = unstable_cache(
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
    direction = DEFAULT_DIRECTION,
    search,
    limit = DEFAULT_PAGE_SIZE,
    sort = "createdAt",
    projectId,
  } = params;

  const conditions: SQL<unknown>[] = [];
  addSearchFilters(conditions, search, [
    tickets.title,
    tickets.slug,
    tickets.assignee,
  ]);
  if (projectId) {
    conditions.push(eq(tickets.projectId, projectId));
  }

  const cursorCondition = buildCursorCondition({
    cursor,
    direction,
    sort,
    createdAtColumn: tickets.createdAt,
    textColumn: tickets.title,
    idColumn: tickets.id,
  });
  if (cursorCondition) {
    conditions.push(cursorCondition);
  }

  const baseQuery = db.select().from(tickets);
  const filteredQuery = conditions.length
    ? baseQuery.where(and(...conditions))
    : baseQuery;

  return filteredQuery
    .orderBy(
      ...buildOrderBy({
        direction,
        sort,
        createdAtColumn: tickets.createdAt,
        textColumn: tickets.title,
        idColumn: tickets.id,
      })
    )
    .limit(limit);
};

const ticketList = unstable_cache(
  async (params: ListParams & { projectId?: number }) => {
    const result = await cursorPaginate<Ticket, string>({
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit ?? DEFAULT_PAGE_SIZE,
      fetcher: (fetchParams) => ticketFetcher({ ...params, ...fetchParams }),
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

export function getTicketDetail(id: number) {
  const detail = unstable_cache(
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
    direction = DEFAULT_DIRECTION,
    search,
    limit = DEFAULT_PAGE_SIZE,
    sort = "createdAt",
  } = params;
  const conditions: SQL<unknown>[] = [];
  addSearchFilters(conditions, search, [
    members.name,
    members.email,
    members.slug,
  ]);

  const cursorCondition = buildCursorCondition({
    cursor,
    direction,
    sort,
    createdAtColumn: members.createdAt,
    textColumn: members.name,
    idColumn: members.id,
  });
  if (cursorCondition) {
    conditions.push(cursorCondition);
  }

  const baseQuery = db.select().from(members);
  const filteredQuery = conditions.length
    ? baseQuery.where(and(...conditions))
    : baseQuery;

  return filteredQuery
    .orderBy(
      ...buildOrderBy({
        direction,
        sort,
        createdAtColumn: members.createdAt,
        textColumn: members.name,
        idColumn: members.id,
      })
    )
    .limit(limit);
};

const memberList = unstable_cache(
  async (params: ListParams) => {
    const result = await cursorPaginate<Member, string>({
      cursor: params.cursor,
      direction: params.direction,
      limit: params.limit ?? DEFAULT_PAGE_SIZE,
      fetcher: (fetchParams) => memberFetcher({ ...params, ...fetchParams }),
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

export function getMemberDetail(id: number) {
  const detail = unstable_cache(
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
