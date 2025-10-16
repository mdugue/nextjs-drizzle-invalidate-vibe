import { describe, expect, it } from "bun:test";
import { cursorPaginate } from "@/lib/pagination";

const DATASET_SIZE = 50;
const PAGE_LIMIT = 5;
const REMOVED_ID = 3;
const SECOND_PAGE_OFFSET = PAGE_LIMIT;
const ID_OFFSET = 1;

describe("cursorPaginate", () => {
  it("backfills to keep page length after deletion", async () => {
    const dataset = Array.from({ length: DATASET_SIZE }, (_, index) => ({
      id: index + ID_OFFSET,
    }));
    const { items: firstPage } = await cursorPaginate({
      limit: PAGE_LIMIT,
      fetcher: async ({ limit }) => dataset.slice(0, limit),
      getCursor: (item) => String(item.id),
    });

    expect(firstPage).toHaveLength(PAGE_LIMIT);

    const remaining = dataset.filter((item) => item.id !== REMOVED_ID);

    const { items: secondPage } = await cursorPaginate({
      cursor: String(firstPage.at(-1)?.id),
      limit: PAGE_LIMIT,
      fetcher: async ({ limit }) =>
        remaining.slice(SECOND_PAGE_OFFSET, SECOND_PAGE_OFFSET + limit),
      getCursor: (item) => String(item.id),
    });

    expect(secondPage).toHaveLength(PAGE_LIMIT);
  });
});
