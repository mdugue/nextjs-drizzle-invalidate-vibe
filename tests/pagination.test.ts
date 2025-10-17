import { describe, expect, it } from "bun:test";
import { cursorPaginate } from "@/lib/pagination";

const DATASET_SIZE = 50;
const PAGE_SIZE = 5;
const REMOVED_ID = 3;

describe("cursorPaginate", () => {
  it("backfills to keep page length after deletion", async () => {
    const dataset = Array.from({ length: DATASET_SIZE }, (_, index) => ({
      id: index + 1,
    }));
    const { items: firstPage } = await cursorPaginate({
      limit: PAGE_SIZE,
      fetcher: async ({ limit }) => dataset.slice(0, limit),
      getCursor: (item) => String(item.id),
    });

    expect(firstPage).toHaveLength(PAGE_SIZE);

    const remaining = dataset.filter((item) => item.id !== REMOVED_ID);

    const { items: secondPage } = await cursorPaginate({
      cursor: String(firstPage.at(-1)?.id),
      limit: PAGE_SIZE,
      fetcher: async ({ limit }) =>
        remaining.slice(PAGE_SIZE, PAGE_SIZE + limit),
      getCursor: (item) => String(item.id),
    });

    expect(secondPage).toHaveLength(PAGE_SIZE);
  });
});
