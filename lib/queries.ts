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

type ListParams = CursorPaginationParams<string> & {
  search?: string;
  sort?: SortOption;
};

const DEFAULT_LIST_LIMIT = 20;

type SortableColumns = {
  createdAt: AnyColumn;
  text: AnyColumn;
  id: AnyColumn;
};

function buildSearchFilters(columns: AnyColumn[], search?: string) {
  if (!search) {
    return [] as SQL<unknown>[];
  }
  const pattern = `%${search.toLowerCase()}%`;
  const searchConditions = columns
    .map((column) => like(column, pattern))
    .filter(isSql);
  if (searchConditions.length === 0) {
    return [] as SQL<unknown>[];
  }
  const combined =
    searchConditions.length === 1
      ? searchConditions[0]
      : or(...searchConditions);
  return combined ? [combined] : [];
}

function combineComparisons(
  comparison?: SQL<unknown>,
  tieCondition?: SQL<unknown>
) {
  if (comparison && tieCondition) {
    const combined = or(comparison, tieCondition);
    return combined ? [combined] : [tieCondition];
  }
  if (comparison) {
    return [comparison];
  }
  if (tieCondition) {
    return [tieCondition];
  }
  return [] as SQL<unknown>[];
}

type CursorFilterArgs = {
  cursor?: string;
  direction: PaginationDirection;
  sort: SortOption;
  columns: SortableColumns;
};

function buildCursorFilters({
  cursor,
  direction,
  sort,
  columns,
}: CursorFilterArgs) {
  if (!cursor) {
    return [] as SQL<unknown>[];
  }
  const { primary, secondary } = decodeCursor(cursor);
  const comparator = direction === "forward" ? lt : gt;
  const tieComparator = comparator;

  if (sort === "createdAt") {
    const value = new Date(primary);
    if (Number.isNaN(value.getTime())) {
      return [] as SQL<unknown>[];
    }
    const compareResult = comparator(columns.createdAt, value);
    const tieCondition = and(
      eq(columns.createdAt, value),
      tieComparator(columns.id, secondary)
    );
    return combineComparisons(compareResult, tieCondition);
  }

  const value = String(primary);
  const primaryComparison = comparator(columns.text, value);
  const tieCondition = and(
    eq(columns.text, value),
    tieComparator(columns.id, secondary)
  );
  return combineComparisons(primaryComparison, tieCondition);
}

function resolveOrderBy({
  direction,
  sort,
  columns,
}: {
  direction: PaginationDirection;
  sort: SortOption;
  columns: SortableColumns;
}) {
  const isForward = direction === "forward";
  if (sort === "createdAt") {
    return isForward
      ? [desc(columns.createdAt), desc(columns.id)]
      : [asc(columns.createdAt), asc(columns.id)];
  }
  return isForward
    ? [asc(columns.text), asc(columns.id)]
    : [desc(columns.text), desc(columns.id)];
}
const projectColumns = {
  createdAt: projects.createdAt,
  text: projects.title,
  id: projects.id,
} as const;

const projectFetcher = (params: ListParams) => {
  const direction = params.direction ?? "forward";
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const sort = params.sort ?? "createdAt";

  const filters = [
    ...buildSearchFilters(
      [projects.title, projects.slug, projects.owner],
      params.search
    ),
    ...buildCursorFilters({
      cursor: params.cursor,
      direction,
      sort,
      columns: projectColumns,
    }),
  ];

  const baseQuery = db.select().from(projects);
  const filteredQuery = filters.length
    ? baseQuery.where(and(...filters))
    : baseQuery;

  return filteredQuery
    .orderBy(...resolveOrderBy({ direction, sort, columns: projectColumns }))
    .limit(limit);
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

const ticketColumns = {
  createdAt: tickets.createdAt,
  text: tickets.title,
  id: tickets.id,
} as const;

const ticketFetcher = (
  params: ListParams & {
    projectId?: number;
  }
) => {
  const direction = params.direction ?? "forward";
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const sort = params.sort ?? "createdAt";

  const filters = [
    ...buildSearchFilters(
      [tickets.title, tickets.slug, tickets.assignee],
      params.search
    ),
    ...buildCursorFilters({
      cursor: params.cursor,
      direction,
      sort,
      columns: ticketColumns,
    }),
  ];

  if (params.projectId != null) {
    filters.push(eq(tickets.projectId, params.projectId));
  }

  const baseQuery = db.select().from(tickets);
  const filteredQuery = filters.length
    ? baseQuery.where(and(...filters))
    : baseQuery;

  return filteredQuery
    .orderBy(...resolveOrderBy({ direction, sort, columns: ticketColumns }))
    .limit(limit);
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

const memberColumns = {
  createdAt: members.createdAt,
  text: members.name,
  id: members.id,
} as const;

const memberFetcher = (params: ListParams) => {
  const direction = params.direction ?? "forward";
  const limit = params.limit ?? DEFAULT_LIST_LIMIT;
  const sort = params.sort ?? "createdAt";

  const filters = [
    ...buildSearchFilters(
      [members.name, members.email, members.slug],
      params.search
    ),
    ...buildCursorFilters({
      cursor: params.cursor,
      direction,
      sort,
      columns: memberColumns,
    }),
  ];

  const baseQuery = db.select().from(members);
  const filteredQuery = filters.length
    ? baseQuery.where(and(...filters))
    : baseQuery;

  return filteredQuery
    .orderBy(...resolveOrderBy({ direction, sort, columns: memberColumns }))
    .limit(limit);
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
