export type PaginationDirection = "forward" | "backward";

export type CursorPaginationParams<TCursor> = {
  cursor?: TCursor;
  direction?: PaginationDirection;
  limit?: number;
};

export type CursorPaginationResult<T, TCursor> = {
  items: T[];
  pageInfo: {
    hasNext: boolean;
    hasPrevious: boolean;
    nextCursor?: TCursor;
    prevCursor?: TCursor;
  };
};

export type CursorPaginationFetcherArgs<TCursor> = {
  cursor?: TCursor;
  direction: PaginationDirection;
  limit: number;
};

export async function cursorPaginate<T, TCursor>(params: {
  cursor?: TCursor;
  direction?: PaginationDirection;
  limit?: number;
  fetcher: (args: CursorPaginationFetcherArgs<TCursor>) => Promise<T[]>;
  getCursor: (item: T) => TCursor;
}): Promise<CursorPaginationResult<T, TCursor>> {
  const limit = Math.max(1, params.limit ?? 20);
  const direction: PaginationDirection = params.direction ?? "forward";
  const { fetcher, getCursor } = params;

  const records = await fetcher({
    cursor: params.cursor,
    direction,
    limit: limit + 1,
  });

  const hasMore = records.length > limit;
  const trimmed = hasMore ? records.slice(0, limit) : records;
  const items = direction === "backward" ? [...trimmed].reverse() : trimmed;

  const pageInfo = {
    hasNext:
      direction === "forward"
        ? hasMore
        : Boolean(params.cursor) || records.length === limit + 1,
    hasPrevious: direction === "backward" ? hasMore : Boolean(params.cursor),
    nextCursor: items.length > 0 ? getCursor(items.at(-1)) : params.cursor,
    prevCursor: items.length > 0 ? getCursor(items[0]) : params.cursor,
  } satisfies CursorPaginationResult<T, TCursor>["pageInfo"];

  return { items, pageInfo };
}

export function parsePaginationParams(
  searchParams: URLSearchParams
): CursorPaginationParams<string> {
  const cursor = searchParams.get("cursor") ?? undefined;
  const directionParam = searchParams.get("direction");
  const direction = directionParam === "backward" ? "backward" : "forward";
  return { cursor: cursor ?? undefined, direction };
}

export function paginationToSearchParams({
  cursor,
  direction,
}: CursorPaginationParams<string>) {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  if (direction && direction !== "forward") {
    params.set("direction", direction);
  }
  return params.toString() ? `?${params.toString()}` : "";
}
